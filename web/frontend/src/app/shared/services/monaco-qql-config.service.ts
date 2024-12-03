import {Injectable, OnDestroy} from '@angular/core';
import {Store, select} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {BehaviorSubject, combineLatest, fromEvent, Observable, of, ReplaySubject, Subject} from 'rxjs';
import { delay, filter, map, pluck, shareReplay, switchMap, take, takeUntil, tap, withLatestFrom }          from 'rxjs/operators';
import * as NotificationsActions                                                from '../../core/modules/notifications/store/notifications.actions';
import {AppState} from '../../core/store';
import {QueryFunction} from '../../pages/query/query-function';
import {MonacoEditorOptions, QqlSequenceKeyWord, QqlSequenceKeyWord56, QQLSyntaxGroup} from '../models/qql-editor';
import {getClipboard, supportsReadFromClipboard} from '../utils/copy';
import {GlobalFiltersService} from './global-filters.service';
import {MonacoQqlTokensService} from './monaco-qql-tokens.service';
import {MonacoService} from './monaco.service';
import ICursorPositionChangedEvent = monaco.editor.ICursorPositionChangedEvent;
import ITextModel = monaco.editor.ITextModel;
import IPosition = monaco.IPosition;
import IRange = monaco.IRange;
import CompletionItem = monaco.languages.CompletionItem;
import CompletionList = monaco.languages.CompletionList;
import { AppInfoService } from './app-info.service';
import { getAppInfo } from 'src/app/core/store/app/app.selectors';
import { SchemaService } from './schema.service';
import { StreamsService } from './streams.service';
import { SchemaAllTypeModel, SchemaTypeModel } from '../models/schema.type.model';

const alterPatterns = [
  {
    startWith: QqlSequenceKeyWord.alter,
    patterns: [`alter {classEnumOrField} {entityName} (`]
  },
  {
    startWith: QqlSequenceKeyWord56.rewrite,
    patterns: [`rewrite {classEnumOrField} {entityName}`]
  },
  {
    startWith: QqlSequenceKeyWord56.add,
    patterns: [`add {classEnumOrField}`]
  },
  {
    startWith: QqlSequenceKeyWord.drop,
    patterns: [`drop {classEnumOrField} {entityName}`]
  },
  {
    startWith: QqlSequenceKeyWord.field,
    patterns: [`field {fieldName}`]
  },
  {
    startWith: QqlSequenceKeyWord56.set,
    patterns: [`set {propertyName}`]
  },
  {
    startWith: QqlSequenceKeyWord.confirm,
    patterns: [`confirm {confirmOptions}`]
  }
];

const createStreamSnippet = `${QqlSequenceKeyWord.create} \${1:TRANSIENT|DURABLE} ${QqlSequenceKeyWord.stream} \${2:NAME} (
  ${QqlSequenceKeyWord.class} \${3:typeName} \${4:name} (
    \${5:fieldName} \${6:name} \${7:fieldType} ${QqlSequenceKeyWord.comment} \${8:commentText}
  ) \${9:AUXILIARY}; \${10}
)
OPTIONS (\${11})
COMMENT \${12:text}`;

const modifyStreamSnippet = `
${QqlSequenceKeyWord.class} \${1:typeName} \${2:name} (
  \${3:field} \${4:fieldName} \${5:fieldType} ${QqlSequenceKeyWord.comment} \${6:commentText}
) \${7:AUXILIARY};`;

const switchCaseSnippet = `${QqlSequenceKeyWord.case} \${1:expression} 
${QqlSequenceKeyWord.when} \${2:value} ${QqlSequenceKeyWord.then} \${3:result} 
${QqlSequenceKeyWord.else} \${4:result} ${QqlSequenceKeyWord.end}`;

const snippetsForAlter = [ 
  { label: 'alter', text: ` \n  ${QqlSequenceKeyWord.alter}` }, 
  { label: 'set', text: ` \n  ${QqlSequenceKeyWord56.set}` },
  { label: 'add', text: ` \n  ${QqlSequenceKeyWord56.add}` },
  { label: 'drop', text: ` \n  ${QqlSequenceKeyWord.drop}` },
  { label: 'rewrite', text: ` \n  ${QqlSequenceKeyWord56.rewrite}`}
];

const snippetsForEnumAlter = [ 
  { label: 'alter', text:  ` \n  ${QqlSequenceKeyWord.alter}` }, 
  { label: 'add', text: ` \n  ${QqlSequenceKeyWord56.add}` },
  { label: 'rename', text: ` \n  ${QqlSequenceKeyWord56.rename}` },
  { label: 'rewrite', text: ` \n  ${QqlSequenceKeyWord56.rewrite}` },
  { label: 'drop', text: ` \n  ${QqlSequenceKeyWord.drop}` }
];

export const dataTypes = [
  'INT8', 'INT16', 'INT32', 'INT64', 'FLOAT32', 'FLOAT64', 'DECIMAL', 
  'BOOLEAN', 'CHAR', 'TIMESTAMP(MS)', 'TIMESTAMP(NS)', 'VARCHAR', 'ENUM'];

@Injectable()
export class MonacoQqlConfigService implements OnDestroy {
  static idCounter = 0;
  
  private streamsProvider$: Observable<string[]>;
  private columnsProvider: (stream: string) => Observable<string[]>;
  private functionsProvider$: Observable<QueryFunction[]>;
  private streamColumns: {[index: string]: Observable<string[]>} = {};
  private columns$ = new ReplaySubject<string[]>(1);
  private editor$ = new BehaviorSubject<any>(null);
  private decorations: string[];
  private disablePaste: boolean;
  private ctrlEnter$ = new Subject<void>();
  private contentChange$ = new Subject<void>();
  private dataTypes: string[];
  private cursorPosition$ = new BehaviorSubject<{lineNumber: number; column: number}>(null);
  private destroy$ = new Subject();
  private id: number;
  private tokenizerInit$ = new ReplaySubject<void>(1);
  private havingAndRecordsAvailable$: Observable<boolean>;
  private alterAvailable$ = new BehaviorSubject<boolean>(false);
  private ddlQuery: boolean;

  constructor(
    private monacoSqlTokensService: MonacoQqlTokensService,
    private monacoService: MonacoService,
    private translateService: TranslateService,
    private appStore: Store<AppState>,
    private globalFiltersService: GlobalFiltersService,
    private appInfoService: AppInfoService,
    private schemaService: SchemaService,
    private streamsService: StreamsService
  ) {
    this.id = MonacoQqlConfigService.idCounter;
    MonacoQqlConfigService.idCounter ++;
    this.monacoService.registerLanguage(this.languageKey(), {wordPattern: /([^\s]+)/g});
    this.monacoSqlTokensService.init(this.languageKey());
    this.disablePaste = !supportsReadFromClipboard();
    this.monacoService.setAutoCompleteProvider(this.languageKey(), this.getSuggestions.bind(this));

    this.havingAndRecordsAvailable$ = this.appStore.pipe(select(getAppInfo))
      .pipe(filter(info => !!info), map((info) => this.appInfoService.checkTimebaseVersion('5.5.83', info)));

    this.appStore.pipe(select(getAppInfo))
      .pipe(filter(info => !!info))
      .subscribe(info => this.alterAvailable$.next(this.appInfoService.checkTimebaseVersion('5.6.67', info)));

    // fromEvent(document, 'keyup')
    //   .pipe(
    //     filter((event: KeyboardEvent) => (event.key === 'Enter' || (event.key === ' ' && event.ctrlKey)) 
    //       && (event.target as HTMLElement).className === 'inputarea'),
    //     takeUntil(this.destroy$),
    //     delay(500))
    //   .subscribe((e) => {
    //     const editor = this.editor$.getValue();
    //     editor.trigger('', 'editor.action.triggerSuggest');
    // });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  init(
    editor: any,
    streamsProvider$: Observable<string[]>,
    columnsProvider: (stream: string) => Observable<string[]>,
    functionsProvider$: Observable<QueryFunction[]>,
    dataTypes: string[],
  ) {
    this.functionsProvider$ = functionsProvider$;
    this.dataTypes = [
      ...dataTypes.map((t) => t.toLowerCase()),
      ...dataTypes.map((t) => t.toUpperCase()),
    ];
    // For mac ctrl space bind on system call
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Space, () =>
      editor.trigger('', 'editor.action.triggerSuggest', ''),
    );

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => this.ctrlEnter$.next());

    this.translateService
      .get('qqlEditor.paste')
      .pipe(take(1))
      .subscribe((lang) => {
        editor.addAction({
          id: 'paste',
          label: lang.title + (this.disablePaste ? ' ' + lang.notSupported : ''),
          keybindings: [],
          contextMenuGroupId: 'paste',
          run: (editor) => {
            getClipboard()
              .pipe(take(1))
              .subscribe(
                (text) => {
                  const selection = editor.getSelection();
                  editor.executeEdits(null, [
                    {
                      range: selection,
                      text: text,
                      forceMoveMarkers: true,
                    },
                  ]);
                },
                () => {
                  this.appStore.dispatch(
                    new NotificationsActions.AddAlert({
                      message: lang.denied,
                      dismissible: true,
                      closeInterval: 5000,
                    }),
                  );
                },
              );
          },
        });
      });

    this.streamsProvider$ = streamsProvider$;
    this.columnsProvider = columnsProvider;
    this.streamsProvider$
      .pipe(takeUntil(this.destroy$))
      .subscribe((streams) =>
        this.monacoSqlTokensService.setStreams(streams.map(this.formatStream)),
      );
    this.monacoSqlTokensService.setDataTypes(this.dataTypes);
    this.onContentChange(editor.getModel(), editor.getPosition());
    editor.onDidChangeModelContent(() =>
      this.onContentChange(editor.getModel(), editor.getPosition()),
    );
    editor.onDidChangeCursorPosition((e: ICursorPositionChangedEvent) =>
      this.cursorPosition$.next(e.position),
    );
    const textRange = editor.getModel().getFullModelRange();
    this.cursorPosition$.next({lineNumber: textRange.endLineNumber, column: textRange.endColumn});
    this.editor$.next(editor);
  }

  setSize(size: {height: number; width: number}) {
    this.getEditor().subscribe((editor) => editor.layout(size));
  }

  setError(range: IRange, setSelection = true, queryRange = null, beforeExecution = false) {
    this.clearDecorations();

    let queryDecorator = queryRange ? [
      { range: queryRange, 
        options: {
          isWholeLine: true,
          linesDecorationsClassName: 'linked-code-decoration-margin',
          className: 'linked-code-decoration-line' 
        } 
      },
      { range: queryRange, options: { inlineClassName: 'qql-selected' } }
    ] : null;

    if (queryRange && JSON.stringify(Object.values(queryRange)) === JSON.stringify([0,0,0,0])) {
      queryDecorator?.shift();
    }

    const errorClass = beforeExecution ? 'qql-error' : 'qql-error-underlined';
    const errorDecorator = {range, options: {inlineClassName: errorClass}};

    this.getEditor().subscribe((editor) => {
      this.decorations = editor.deltaDecorations(
        [],
        queryDecorator ? [...queryDecorator, errorDecorator] : [errorDecorator]
      );
      
      if (setSelection) {
        editor.setSelection(range);
        editor.focus();
        editor.revealRangeInCenterIfOutsideViewport(range);
      }
    });

    fromEvent(document, 'keydown')
      .pipe(
        filter((event: KeyboardEvent) => (event.key === ' ' && event.ctrlKey) 
          && (event.target as HTMLElement).className === 'inputarea'),
        takeUntil(this.destroy$))
      .subscribe(() => {
        const editor = this.editor$.getValue();
        editor.trigger('', 'editor.action.triggerSuggest');
    });
  }

  setSelectedText(range: IRange, errorRange: IRange, errorInsideSelectedText: boolean) {
    let errorDecorator;
    if (errorRange && !errorInsideSelectedText) {
      errorDecorator = { range: errorRange, options: { inlineClassName: 'qql-error-underlined' } };
    }

    let queryDecorator = [
      { range, 
        options: {
          isWholeLine: true,
          linesDecorationsClassName: 'linked-code-decoration-margin',
          className: 'linked-code-decoration-line',
        }
      },
      { range, options: { inlineClassName: 'qql-selected' } }
    ];

    if (JSON.stringify(Object.values(range)) === JSON.stringify([0,0,0,0])) {
      queryDecorator.shift();
    }

    this.clearDecorations();
    if (range) {
      this.getEditor().subscribe((editor) => {
        this.decorations = editor.deltaDecorations(
          [],
          errorDecorator ? [errorDecorator, ...queryDecorator] : queryDecorator
        );
      });
    }
  }

  options(): MonacoEditorOptions {
    return {
      theme: 'qqlTheme',
      language: this.languageKey(),
      automaticLayout: false,
      extraEditorClassName: this.disablePaste ? 'disable-paste' : null,
      minimap: {
        enabled: false,
      },
    };
  }

  onCtrlEnter() {
    return this.ctrlEnter$.asObservable();
  }

  onChangePosition(): Observable<{lineNumber: number; column: number}> {
    return this.cursorPosition$.asObservable();
  }

  insertValue(string: string, position: {lineNumber: number; column: number}) {
    this.getEditor().subscribe((editor) => {
      const range = new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column,
      );
      editor.executeEdits('my-source', [
        {
          identifier: {major: 1, minor: 1},
          range,
          text: (position.column > 1 ? ' ' : '') + string,
          forceMoveMarkers: true,
        },
      ]);
    });
  }

  onColumns(): Observable<string[]> {
    return this.columns$.asObservable();
  }

  getStreams(query: string): string[] {
    let streams = [];
    query
      .split(new RegExp(QqlSequenceKeyWord.union, 'i'))
      .map((block) => {
        const streamList = this.getStream(block);
        streams = [
          ...streams,
          streamList.filter(stream => !!stream)
        ] ;
      });
    return streams;
  }

  onChange(): Observable<void> {
    return this.contentChange$.asObservable();
  }

  private getEditor(): Observable<any> {
    return this.editor$.pipe(filter(Boolean), take(1));
  }
  
  tokenizerInit(): Observable<void> {
    return this.tokenizerInit$.asObservable();
  }

  private onContentChange(model: ITextModel, position: IPosition) {
    this.contentChange$.next();
    this.clearDecorations();
    const streams = [];
    const editor = this.editor$.getValue();
    this.syntaxGroups(editor?.getValue() ?? '')
      .pipe(take(1))
      .subscribe((syntaxGroups) => {
        const cursorPosition = this.getCursorPosition(model, position);
        this.getUnionBlocks(model).forEach((block) => {
          const stream = this.getStream(block.text);
          if (stream) {
            streams.push(stream);
          }
          const columns = new Set<string>();
          const presentGroups = this.getGroup(
            syntaxGroups,
            block.text,
            cursorPosition - block.start,
          ).presentGroups;
          const afterKeyWords = [];
          const indexInPresents = presentGroups.findIndex(
            (g) => g.startWith === QqlSequenceKeyWord.select || g.startWith === QqlSequenceKeyWord.alter
          );
          if (indexInPresents === -1) {
            return;
          }

          const nextGroup = presentGroups[indexInPresents + 1];
          if (nextGroup) {
            afterKeyWords.push(nextGroup.startWith);
            nextGroup.optionalPrepend?.forEach((k) => afterKeyWords.push(k));
          }
          const groupRegexp = afterKeyWords.length
            ? `(?:(?!${afterKeyWords.join('|')}).)+`
            : '(.*)';
          const columnsMatch = block.text.match(new RegExp(`select\\s+${groupRegexp}`, 'gi'));
          if (columnsMatch) {
            columnsMatch[0]
              .replace(/select/gi, '')
              .replace(/,/g, ' ')
              .split(' ')
              .map(f => f.trim())
              .filter(Boolean)
              .forEach((col) => columns.add(col));
          }

          this.columns$.next([...columns]);
        });

        if (streams.length) {
          combineLatest(streams.map((stream) => this.getColumns(stream)))
            .pipe(take(1), map(this.flatArrays))
            .subscribe((columns: string[]) => {
              this.monacoSqlTokensService.setFields(columns);
            });
        }

        this.getFunctions()
          .pipe(take(1))
          .subscribe((functions) => {
            this.monacoSqlTokensService.setFunctions(functions.map((f) => f.name));
            MonacoService.monacoLoad$.pipe(take(1)).subscribe(() => {
              this.tokenizerInit$.next();
            });
          });
      });
  }

  private clearDecorations() {
    if (this.editor$.value && this.decorations) {
      this.editor$.value.deltaDecorations(this.decorations, []);
      this.decorations = null;
    }
  }

  private getSuggestions(model: ITextModel, position: IPosition): Observable<CompletionList> {
    const cursorPosition = this.getCursorPosition(model, position);
    const block = this.getUnionBlocks(model).find(
      (block) => block.start <= cursorPosition && block.end >= cursorPosition,
    );
    const word = model.getWordUntilPosition(position);
    const split = word.word.split(/,|\(|\)|\}|\{/gi);
    const searchWord = split[split.length - 1];
    const searchOffset = word.word.length - searchWord.length;

    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn + searchOffset,
      endColumn: word.endColumn,
    };
    return this.getBlockSuggestions(cursorPosition - block.start, block.text, range);
  }

  private getUnionBlocks(model: ITextModel) {
    const blockSeparator = QqlSequenceKeyWord.union;
    const value = model.getValue().replace(/(\r\n|\n|\r)/gm, '');
    const textBlocks = value.split(blockSeparator);

    const mergedBlocks = [];
    let i = 0;
    while (i < textBlocks.length) {
      const streamUnion = (block1: string, block2: string) => (block1?.trim().endsWith('"') && block2?.trim().startsWith('"')) || 
        (block1?.includes('(') && !block2?.includes(')'));
      if (mergedBlocks[mergedBlocks.length - 1] && textBlocks[i] && streamUnion(mergedBlocks[mergedBlocks.length - 1], textBlocks[i])) {
        mergedBlocks[mergedBlocks.length - 1] = 
          `${mergedBlocks[mergedBlocks.length - 1]}${QqlSequenceKeyWord.union}${textBlocks[i]}`;
        i += 1;
      } else if (textBlocks[i + 1] && textBlocks[i] && streamUnion(textBlocks[i], textBlocks[i + 1])) {
        mergedBlocks.push(`${textBlocks[i]}${QqlSequenceKeyWord.union}${textBlocks[i + 1]}`);
        i += 2;
      } else {
        mergedBlocks.push(`${textBlocks[i]}`);
        i += 1;
      }
    }

    let start = 0;
    return mergedBlocks.map((text) => {
      const end = start + text.length;
      const block = {start, end, text};
      start = end + blockSeparator.length;
      return block;
    });
  }

  private getStream(text: string): string[] | null {
    if (text.includes(`${QqlSequenceKeyWord.from} (`)) {
      const list = text.split('(')[1].split(`${QqlSequenceKeyWord.union}`)
        .map(streamName => streamName.trim().split(')')[0])
        .filter(streamName => streamName && streamName !== '"')
        .map(streamName => streamName.trim().replace(/\"/g, ''));
      return list;
    } else {
      const stream = text.match(/"([^"]+)"/)?.[1];
      return stream ? [ stream ] : null;
    }
  }

  private getBlockSuggestions(
    cursorPosition: number,
    blockText: string,
    range: IRange,
  ): Observable<CompletionList> {
    const aliases = this.getAliases(blockText, cursorPosition);
    const streams = this.getStream(blockText);
    const textBeforeCursor = this.getTextBeforeCursor();

    return this.syntaxGroups(textBeforeCursor).pipe(
      switchMap((syntaxGroups) => {
        const streams$ = this.parseBlock(blockText.toLowerCase(), cursorPosition, syntaxGroups, textBeforeCursor)
          .map(entry => {
            return this.getEntrySuggestions(entry, streams, aliases, range, textBeforeCursor);
          }
        );
        return streams$.length ? combineLatest(streams$).pipe(map(this.flatArrays)) : of([]);
      }),
      map((suggestions) => {
        if (!suggestions.length) {
          return {suggestions: [{label: 'No suggestions', insertText: ''}]};
        }

        return {suggestions: suggestions.map((s) => ({...s, insertText: `${s?.insertText ?? ''} `}))};
      }),
    );
  }

  private getAliases(blockText: string, cursorPosition: number): string[] {
    const parts = this.getParts(blockText, cursorPosition);
    if (/\s+as$/i.test(parts.left.trim())) {
      return [];
    }

    const withoutWord = `${parts.left} ${parts.right}`;
    const aliases = new Set<string>();
    [...withoutWord.matchAll(/([a-z\.\"\']+)\s+as\s+([a-z0-9]+)[\s+|,]/gi)].forEach((match) =>
      aliases.add(match[2]),
    );
    const dataTypeRegExp = new RegExp(this.dataTypes.join('|'), 'i');
    return [...aliases].filter((alias) => !dataTypeRegExp.test(alias));
  }

  private getEntrySuggestions(
    entry: string,
    streams: string[],
    aliases: string[],
    range: IRange,
    textBeforeCursor: string
  ): Observable<CompletionItem[]> {
    const streamKey = this.getStream(textBeforeCursor)?.[0];

    if (entry === '(' && [QqlSequenceKeyWord.alter, QqlSequenceKeyWord.modify].some(word => textBeforeCursor.trim().startsWith(word))) {
      if (textBeforeCursor.startsWith(QqlSequenceKeyWord.modify)) {
        let streamDetails$: Observable<string>;
        if (this.monacoService.currentDDLStreamDetails[streamKey]) {
          streamDetails$ = of(this.monacoService.currentDDLStreamDetails[streamKey]);
        } else {
          streamDetails$ = this.streamsService.describe(streamKey)
            .pipe(pluck('ddl'), tap(details => this.monacoService.currentDDLStreamDetails[streamKey] = details));
        }

        return streamDetails$.pipe(
          map(descrioption => [{
            label: '(stream description)',
            filterText: '(',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            insertText: `${textBeforeCursor.trim().endsWith('(') ? '' : '('} ${descrioption.split('(').slice(1).join('(')}`,
            range
          }])
        )
      } else if (textBeforeCursor.startsWith(QqlSequenceKeyWord.alter)) {
        const classOrEnum = textBeforeCursor.split(QqlSequenceKeyWord.alter).pop()
          .trim().split(' ').map(f => f.trim()).filter(Boolean)?.[0];
        const snippets = classOrEnum.trim() !== QqlSequenceKeyWord.enum ? snippetsForAlter : snippetsForEnumAlter;

        if (textBeforeCursor.includes('(')) {
          return of(snippets.filter(s => s.label !== 'set').map(({ label, text }) => ({
            label,
            filterText: '(',
            kind: monaco.languages.CompletionItemKind.Struct,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            insertText: `${text}${classOrEnum === QqlSequenceKeyWord.class ? 
              ` ${QqlSequenceKeyWord.field}${label === 'add' ? ` \${1:name}` : ''}` : ''}`,
            range,
          })));
        } else {
          return of(snippets.filter(s => s.label === 'set').map(({ label, text }) => ({
            label,
            filterText: '',
            kind: monaco.languages.CompletionItemKind.Struct,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            insertText: text,
            range,
          })));
        }
      }
    }

    if (entry === '{classOrEnum}') {
      return of([QqlSequenceKeyWord.class, QqlSequenceKeyWord.enum].map(keyword => ({
        label: keyword,
        filterText: keyword,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        insertText: keyword,
        range,
      })))
    }

    if (entry === '{classEnumOrField}') {
      const queryWords = textBeforeCursor.match(/(\b[^\s]+\b)/gm);
      const actionWord = queryWords[queryWords.length - 2];
      const autocompleteForAdd = actionWord === QqlSequenceKeyWord56.add;

      if (queryWords[queryWords.length - 4] === QqlSequenceKeyWord.enum 
        && queryWords[queryWords.length - 5] === QqlSequenceKeyWord.alter) {
        const streamKey = streams[0].replace(/\"/g, '');

        let schema$: Observable<{ types: SchemaTypeModel[]; all: SchemaAllTypeModel[]; }>;
        if (this.monacoService.currentDDLStreamSchema[streamKey]) {
          schema$ = of(this.monacoService.currentDDLStreamSchema[streamKey]);
        } else {
          schema$ = this.schemaService.getSchema(streamKey)
            .pipe(tap(schema => this.monacoService.currentDDLStreamSchema[streamKey] = schema));
        }
        const dropAction = actionWord === QqlSequenceKeyWord.drop;
        const rewriteAction = actionWord === QqlSequenceKeyWord56.rewrite;

        return schema$.pipe(map(schema => {
          const targetEnum = schema.all.find(schemaItem => schemaItem.name === queryWords[queryWords.length - 3]);
          return targetEnum.fields.map(field => ({
            label: `"${field.name}"`,
            filterText: `"${field.name}"`,
            kind: monaco.languages.CompletionItemKind.EnumMember,
            insertText: `"${field.name}" ${(dropAction || rewriteAction) ? '' : QqlSequenceKeyWord56.set}`,
            range
          }))
        }))
      } else {
        let keywords = [ QqlSequenceKeyWord.field, QqlSequenceKeyWord.class, QqlSequenceKeyWord.enum ];
        if (queryWords[queryWords.length - 4] === QqlSequenceKeyWord.class 
          && queryWords[queryWords.length - 5] === QqlSequenceKeyWord.alter) {
          keywords = [ QqlSequenceKeyWord.field ];
        } else if (!queryWords.includes(QqlSequenceKeyWord.class) || !queryWords.includes(QqlSequenceKeyWord.alter)) {
          keywords = [ QqlSequenceKeyWord.class, QqlSequenceKeyWord.enum ];
        }

        return of(keywords.map(keyword => ({
          label: keyword,
          filterText: keyword,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: autocompleteForAdd ? `${keyword} \${1:name}` : keyword,
          range,
        })));
      }
    }

    if (entry === '{fieldName}') {
      const streamKey = streams[0].replace(/\"/g, '');
      const textBeforeCursorAsArray = textBeforeCursor.split(QqlSequenceKeyWord.field);
      textBeforeCursorAsArray.pop();

      const actionWord = textBeforeCursorAsArray.join('').trim();
      const dropField = actionWord.endsWith(QqlSequenceKeyWord.drop);
      const rewriteField = actionWord.endsWith(QqlSequenceKeyWord56.rewrite);

      let schema$: Observable<{ types: SchemaTypeModel[]; all: SchemaAllTypeModel[]; }>;
      if (this.monacoService.currentDDLStreamSchema[streamKey]) {
        schema$ = of(this.monacoService.currentDDLStreamSchema[streamKey]);
      } else {
        schema$ = this.schemaService.getSchema(streamKey)
          .pipe(tap(schema => this.monacoService.currentDDLStreamSchema[streamKey] = schema));
      }

      let streamDetails$: Observable<string>;
      if (rewriteField) {
        if (this.monacoService.currentDDLStreamDetails[streamKey]) {
          streamDetails$ = of(this.monacoService.currentDDLStreamDetails[streamKey]);
        } else {
          streamDetails$ = this.streamsService.describe(streamKey)
            .pipe(pluck('ddl'), tap(details => this.monacoService.currentDDLStreamDetails[streamKey] = details));
        }
      } else {
        streamDetails$ = of('');
      }

      let descriptions: string[];

      return streamDetails$.pipe(
        tap((ddl: string) => descriptions = ddl.split(QqlSequenceKeyWord.class)
          .map(description => description.split(QqlSequenceKeyWord.enum)[0].trim())),
        switchMap(() => schema$),
        map(schema => {
          const targetClass= schema.all.find(schemaItem => textBeforeCursor
            .split(QqlSequenceKeyWord.class).pop().includes(schemaItem.name));
          const classDescription = descriptions.find(d => d.includes(targetClass.name));

          return targetClass.fields.map(field => ({
            label: `"${field.name}"`,
            filterText: `"${field.name}"`,
            kind: monaco.languages.CompletionItemKind.EnumMember,
            insertText: !rewriteField ? `"${field.name}" ${dropField ? '' : QqlSequenceKeyWord56.set}` : 
              `"${field.name}" ${classDescription.split(',')
                .find(str => str.includes(field.name))
                .split(`"${field.name}"`)[1]
                .split(QqlSequenceKeyWord.comment)[0].trim()
                .split(' =')[0].trim()}`,
            range
        }))
      }));
    }

    if (entry === '{propertyName}') {
      const queryWords = textBeforeCursor.match(/(\b[^\s]+\b)/g);

      const streamKey = streams[0].replace(/\"/g, '');
      let schema$: Observable<{ types: SchemaTypeModel[]; all: SchemaAllTypeModel[]; }>;
      if (this.monacoService.currentDDLStreamSchema[streamKey]) {
        schema$ = of(this.monacoService.currentDDLStreamSchema[streamKey]);
      } else {
        schema$ = this.schemaService.getSchema(streamKey)
          .pipe(tap(schema => this.monacoService.currentDDLStreamSchema[streamKey] = schema));
      }

      const typeKeyWords = [ QqlSequenceKeyWord.stream, QqlSequenceKeyWord.class, QqlSequenceKeyWord.field ];
      const lastKeyWord = queryWords.reduce((acc, word) => {
        return typeKeyWords.includes(word as QqlSequenceKeyWord) ? word : acc
      }, '');

      let allProperties$: Observable<[string, string][]>;
      if (lastKeyWord === QqlSequenceKeyWord.stream) {
        allProperties$ = this.streamsService.getProps(streamKey, true).pipe(
         take(1),
          map(({props}) => Object.entries(props)
            .filter(([key]) => !key.includes('range'))
            .reduce((acc, [property, value]) => {
              if (value && typeof value === 'object') {
                acc.push([property, '']);
                return acc;
              } else {
                acc.push([property, value]);  
                return acc;
              }
            }, []))
        )
      } else if (lastKeyWord === QqlSequenceKeyWord.class) {
        const classProperties = [ 'name', 'title', 'description', 'under', 'auxiliary', 'instantiable' ]
        allProperties$ = schema$.pipe(
          map(schema => {
            const targetClass = schema.all.find(schemaItem => textBeforeCursor
              .split(QqlSequenceKeyWord.class).pop().includes(schemaItem.name));
            return classProperties.map(prop => [prop, targetClass[prop]])
              .reduce((acc, [property, value]) => {
                if (value && typeof value === 'object') {
                  acc.push([property, '']);
                  return acc;
                } else {
                  acc.push([property, value]);  
                  return acc;
                }
              }, []);
          })
        );
      } else if (lastKeyWord === QqlSequenceKeyWord.field) {
        allProperties$ = schema$.pipe(
          map(schema => {
            const targetClass = schema.all.find(schemaItem => textBeforeCursor
              .split(QqlSequenceKeyWord.class).pop().includes(schemaItem.name));
            const targetField = targetClass?.fields?.find(fieldItem => textBeforeCursor
              .split(QqlSequenceKeyWord.field).pop().includes(fieldItem.name));
  
            if (targetField) {
              return Object.entries(targetField).reduce((acc, [property, value]) => {
                if (value && typeof value === 'object') {
                  acc.push([property, `${value.name} ${value.encoding ?? ''}`]);
                  return acc;
                } else {
                  acc.push([property, value]);  
                  return acc;
                }
              }, []);
            }
          })
        )
      }

      return allProperties$.pipe(map(allProps => allProps.map(([property, value]) => ({
        label: camelToSnakeCase(property).toUpperCase(),
        filterText: property,
        kind: monaco.languages.CompletionItemKind.EnumMember,
        insertText: `${camelToSnakeCase(property).toUpperCase()}${value ? ` ${value}` : ''}`,
        range
      }))));
    }

    if (entry === '{typeName}') {
      const splittedText = textBeforeCursor.split(' ').map(f => f.trim()).filter(Boolean);
      const isEnum = splittedText[splittedText.length - 2].trim() === QqlSequenceKeyWord.enum;
      const rewrite = splittedText[splittedText.length - 3].trim() === QqlSequenceKeyWord56.rewrite;

      const streamKey = streams[0].replace(/\"/g, '');
      const schema$ = this.schemaService.getSchema(streamKey);

      let streamDetails$: Observable<string>;
      if (rewrite) {
        if (this.monacoService.currentDDLStreamDetails[streamKey]) {
          streamDetails$ = of(this.monacoService.currentDDLStreamDetails[streamKey]);
        } else {
          streamDetails$ = this.streamsService.describe(streamKey)
            .pipe(pluck('ddl'), tap(details => this.monacoService.currentDDLStreamDetails[streamKey] = details));
        }
      } else {
        streamDetails$ = of('');
      }

      let descriptions: string[];


      return streamDetails$.pipe(
        tap((ddl: string) => {
          if (rewrite) {
            if (!isEnum) {
              descriptions = ddl.split(QqlSequenceKeyWord.class)
                .map(description => description.split(QqlSequenceKeyWord.enum)[0].trim());
            } else {
              descriptions = ddl.split(QqlSequenceKeyWord.enum)
                .map(description => description.split(QqlSequenceKeyWord.class)[0].trim());
            }
          }
        }),
        switchMap(() => schema$),
        map(schema => {
          const typeList = schema.all
            .filter(schemaItem => isEnum ? schemaItem.isEnum : !schemaItem.isEnum)
            .map(schemaItem => schemaItem.name);

          return typeList.map(value => ({
            label: `"${value}"`,
            filterText: `"${value}"`,
            kind: monaco.languages.CompletionItemKind.EnumMember,
            insertText: !rewrite ? `"${value}"` : `${descriptions.find(d => d.includes(value))}`,
            range
          }));

        }
      ));
    }

    if (entry === '{entityName}') {
      const queryWords = textBeforeCursor.match(/(\b[^\s]+\b)/g);
      const entityType = queryWords[queryWords.length - 2];
      const actionWord = queryWords[queryWords.length - 3];

      const isEnum = entityType === QqlSequenceKeyWord.enum;
      const isField = entityType === QqlSequenceKeyWord.field;

      const autocompleteForAlterField = isField && actionWord === QqlSequenceKeyWord.drop;
      const autoCompleteForRewrite = actionWord === QqlSequenceKeyWord56.rewrite;

      const streamKey = streams[0]?.replace(/\"/g, '');

      let schema$: Observable<{ types: SchemaTypeModel[]; all: SchemaAllTypeModel[]; }>;
      if (streamKey) {
        if (this.monacoService.currentDDLStreamSchema[streamKey]) {
          schema$ = of(this.monacoService.currentDDLStreamSchema[streamKey]);
        } else {
          schema$ = this.schemaService.getSchema(streamKey)
            .pipe(tap(schema => this.monacoService.currentDDLStreamSchema[streamKey] = schema));
        }
      }

      if (!schema$) {
        return of([{
          label: ``,
          filterText: ``,
          kind: monaco.languages.CompletionItemKind.EnumMember,
          insertText: '',
          range
        }]);
      }

      let streamDetails$: Observable<string>;
      if (autoCompleteForRewrite) {
        if (this.monacoService.currentDDLStreamDetails[streamKey]) {
          streamDetails$ = of(this.monacoService.currentDDLStreamDetails[streamKey]);
        } else {
          streamDetails$ = this.streamsService.describe(streamKey)
            .pipe(pluck('ddl'), tap(details => this.monacoService.currentDDLStreamDetails[streamKey] = details));
        }
      } else {
        streamDetails$ = of('');
      }

      if (isField) {
        let classDescriptions: string[];
        return streamDetails$.pipe(
          tap((ddl: string) => classDescriptions = ddl.split(QqlSequenceKeyWord.class)
            .map(description => description.split(QqlSequenceKeyWord.enum)[0].trim())),
          switchMap(() => schema$),
          map(schema => {
            const targetClass= schema.all.find(schemaItem => textBeforeCursor
              .split(QqlSequenceKeyWord.class).pop().includes(schemaItem.name));
            const classDescription = classDescriptions.find(d => d.includes(targetClass.name));
  
            return targetClass.fields.map(field => ({
              label: `"${field.name}"`,
              filterText: `"${field.name}"`,
              kind: monaco.languages.CompletionItemKind.EnumMember,
              insertText: !autoCompleteForRewrite ? `"${field.name}" ${autocompleteForAlterField ? QqlSequenceKeyWord56.set : ''}` : 
                `"${field.name}" ${classDescription.split(',')
                  .find(str => str.includes(field.name))
                  .split(`"${field.name}"`)[1]
                  .split(QqlSequenceKeyWord.comment)[0].trim()
                  .split(' =')[0].trim()}`,
              range
          }));
        }))
      } else {
        let typeDescriptions: string[];
        return streamDetails$.pipe(
          tap((ddl: string) => {
            if (autoCompleteForRewrite) {
              if (!isEnum) {
                typeDescriptions = ddl.split(QqlSequenceKeyWord.class)
                  .map(description => description.split(QqlSequenceKeyWord.enum)[0].trim());
              } else {
                typeDescriptions = ddl.split(QqlSequenceKeyWord.enum)
                  .map(description => description.split(QqlSequenceKeyWord.class)[0].trim());
              }
            }
          }),
          switchMap(() => schema$),
          map(schema => {
            const typeList = schema.all
              .filter(schemaItem => isEnum ? schemaItem.isEnum : !schemaItem.isEnum)
              .map(schemaItem => schemaItem.name);

            return typeList.map(value => ({
              label: `"${value}"`,
              filterText: `"${value}"`,
              kind: monaco.languages.CompletionItemKind.EnumMember,
              insertText: !autoCompleteForRewrite ? `"${value}"` : `${typeDescriptions.find(d => d.includes(value))}`,
              range
            }));
          }
        ));
      }
    }

    if (entry === '{confirmOptions}') {
      const confirmOptions = ['NO_CONVERSION', 'CONVERT_DATA', 'DROP_ATTRIBUTES', 'DROP_TYPES', 'DROP_DATA'];
      return of(confirmOptions.map(value => ({
        label: value,
        filterText: value.toLowerCase(),
        kind: monaco.languages.CompletionItemKind.EnumMember,
        insertText: value,
        range
      })))
    }

    if (entry.includes(QqlSequenceKeyWord.create) && this.ddlQuery) {
      return of([
        {
          label: QqlSequenceKeyWord.create,
          filterText: QqlSequenceKeyWord.create,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: createStreamSnippet,
          range,
        },
      ]);
    }

    if (entry.includes(QqlSequenceKeyWord.modify) && this.ddlQuery) {
      return of([
        {
          label: QqlSequenceKeyWord.modify,
          filterText: QqlSequenceKeyWord.modify,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: `${QqlSequenceKeyWord.modify} ${QqlSequenceKeyWord.stream}`,
          range,
        },
      ]);
    }

    if (entry.includes(QqlSequenceKeyWord.alter) && this.ddlQuery && this.alterAvailable$.getValue()) {
      return of([
        {
          label: QqlSequenceKeyWord.alter,
          filterText: QqlSequenceKeyWord.alter,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: `${QqlSequenceKeyWord.alter}${!textBeforeCursor.includes(QqlSequenceKeyWord.stream) ? 
            ` ${QqlSequenceKeyWord.stream}` : ''}`,
          range,
        },
      ]);
    }

    if (entry.includes(QqlSequenceKeyWord.drop) && this.ddlQuery) {
      return of([
        {
          label: QqlSequenceKeyWord.drop,
          filterText: QqlSequenceKeyWord.drop,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: `${QqlSequenceKeyWord.drop}${!textBeforeCursor.includes(QqlSequenceKeyWord.stream) ? 
            ` ${QqlSequenceKeyWord.stream}` : ''}`,
          range,
        },
      ]);
    }

    if (entry.toLocaleLowerCase().includes(QqlSequenceKeyWord.class.toLocaleLowerCase()) && this.ddlQuery) {

      return of([
        {
          label: QqlSequenceKeyWord.class,
          filterText: QqlSequenceKeyWord.class,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: modifyStreamSnippet,
          range,
        },
      ]);
    }

    if (this.getLastTypedChar() === ',') {
      return of([]);
    }

    if (entry.includes(QqlSequenceKeyWord.if) && !this.ddlQuery) {
      return of([
        {
          label: QqlSequenceKeyWord.if,
          filterText: QqlSequenceKeyWord.if,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: `${QqlSequenceKeyWord.if} \${1:condition} ${QqlSequenceKeyWord.else} \${2:field}`,
          range,
        },
      ]);
    }

    if (entry.includes(QqlSequenceKeyWord.case.toLocaleLowerCase()) && !this.ddlQuery) {
      return of([
        {
          label: QqlSequenceKeyWord.case,
          filterText: QqlSequenceKeyWord.case,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: switchCaseSnippet,
          range,
        },
      ]);
    }

    if (['{limitExpression}', '{number}'].includes(entry) && !this.ddlQuery) {
      return of([]);
    }

    if (entry === QqlSequenceKeyWord.select && !this.ddlQuery) {
      return of([
        {
          label: QqlSequenceKeyWord.select,
          filterText: QqlSequenceKeyWord.select,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: `${QqlSequenceKeyWord.select} * FROM`,
          range,
        },
      ]);
    }

    if (entry === '{dataTypes}') {
      return of(dataTypes.map(type => ({
          label: type,
          filterText: type,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: type,
          range,
        }),
      ));
    }

    if (entry.includes('({') && !this.ddlQuery) {
      const regExp = /(\(\{[a-z]+\}\))/g;
      if (entry.includes('{interval}') ) {
        const intervals = ['1ms', '1s', '1m', '1h', '1d'];
        return of(intervals.map(interval => {
          const label = `${entry.replace(regExp, '').toUpperCase()}(${interval})`;
          const snippet = `${entry.replace(regExp, '').toUpperCase()}(\${1:${interval}})`;
          return {
            label,
            filterText: label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            insertText: snippet,
            range,
          }
        }));
      }

      const label = `${entry.replace(regExp, '')}()`.toUpperCase();
      const snippet = entry.replace(regExp, '(${1})').toUpperCase();
      return of([
        {
          label: label,
          filterText: label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: snippet,
          range,
        },
      ]);
    }

    if (entry === '{stream}') {
      return this.getSteamsSuggestions(
        range, 
        textBeforeCursor.endsWith(`${QqlSequenceKeyWord.from} (`));
    }

    if (entry === '{expressionList}' && !this.ddlQuery) {
      const columns$ = streams ? this.getColumns(streams) : of([]);
      return combineLatest([
        columns$,
        this.getFunctions(),
        this.getTypes(),
        this.timeFormats(),
        this.globalFiltersService.getFilters(),
      ]).pipe(
        take(1),
        map(([cols, functions, types, timeFormats, filters]) => {
          const typeList = types.map(typeName => ({
            label: typeName,
            filterText: typeName,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: typeName,
            range,
          }));

          const columns = [...cols, ...aliases].map((col) => ({
            label: col.split('.').pop().replace(/"/g, ''),
            filterText: col,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: `${col.trim()}${
              textBeforeCursor.split(QqlSequenceKeyWord.union).pop().includes(QqlSequenceKeyWord.where) ? '' : ','}`,
            range,
          }));

          const funcs = functions.map((func) => {
            let labelAppend: string;
            let insertAppend: string;
            const initArguments = func.initArguments?.map((a, i) => `"${a.name}": \${${i + 1}:${a.defaultValue}}`).join(', ');
            const initArgumentsLabel = func.initArguments?.map((a, i) => `"${a.name}": ${a.defaultValue}`).join(', ');
            const initArgumentsLength = func.initArguments?.length ?? 0;
            if (func.arguments.length) {
              const argumentList = func.arguments.map((a, i) => `\${${initArgumentsLength + i + 2}:${a.name}}`).join(', ');
              const argumentListLabel = func.arguments.map((a, i) => `${a.name}`).join(', ');

              labelAppend = func.stateful ? `{${initArgumentsLabel}}(${argumentListLabel})` : `(${argumentListLabel})`;
              insertAppend = func.stateful ? `{${initArguments}}(${argumentList})` : `(${argumentList})`;
            } else {
              labelAppend = func.stateful ? `{${initArgumentsLabel}}()` : `()`;
              insertAppend = func.stateful ? `{${initArguments}}()` : '()';
            };
            return {
              label: `${func.name}${labelAppend}`,
              filterText: `${func.name}`,
              kind: monaco.languages.CompletionItemKind.Function,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              insertText: `${func.name}${insertAppend}`,
              range,
            };
          });

          const timeFormatAutocomplete = timeFormats.map((format, formatIndex) => {
            const label = `'${format}'d`;
            let insertText = label;
            label.match(/(\{[a-z]+\})/gi).forEach((group, index) => {
              const fill = group.replace(/\{|\}/g, '');
              insertText = insertText.replace(group, `\${${index + 1}:${fill}}`);
            });

            const replaceTimeZone = (string) =>
              string.replace(/TIMEZONE/g, filters.timezone[0].name);

            return {
              label: replaceTimeZone(label),
              filterText: `'`,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              insertText: replaceTimeZone(insertText),
              range,
              sortText: this.numToSSColumn(formatIndex + 1),
            };
          });

          const textBeforeCursorTrimmed = textBeforeCursor.trim();
          if (textBeforeCursorTrimmed.endsWith(',') || textBeforeCursorTrimmed.endsWith(QqlSequenceKeyWord.select)) {
            return [...columns, ...funcs];
          }

          return [...columns, ...funcs, ...typeList, ...timeFormatAutocomplete];
        }),
      );
    }
    
    if (entry === '{enumValue}' && textBeforeCursor.includes('==') && !textBeforeCursor.includes('symbol ==')) {
      const splittedText = textBeforeCursor.split(' ').map(f => f.trim()).filter(Boolean);
      const equalityOperatorIndex = splittedText.findIndex(item => item.includes('=='));
      let className: string;
      let fieldName: string;
      if (splittedText[equalityOperatorIndex] === '==') {
        [className, fieldName] = splittedText[equalityOperatorIndex - 1].split(':');
      } else {
        [className, fieldName] = splittedText[equalityOperatorIndex]?.split('==')[0].split(':');
      }

      const streamKey = textBeforeCursor.match(/"([^"]+)"/)?.[1];
      const schema$ = this.schemaService.getSchema(streamKey);
      return schema$.pipe(
        map(schema => {
          const classItem = schema.all.find(cl => cl.name.endsWith(className));
          const fieldItem = classItem?.fields.find(fl => fl.name === fieldName);
          const enumItem = schema.all.find(cl => cl.name === fieldItem?.type.name && cl.isEnum);
          if (enumItem) {
            return enumItem.fields.map(value => ({
              label: value.name,
              filterText: value.name,
              kind: monaco.languages.CompletionItemKind.EnumMember,
              insertText: value.name,
              range
            }))
          }
        }));
    }

    if (entry.includes(QqlSequenceKeyWord.if) && !this.ddlQuery) {
      return of([
        {
          label: QqlSequenceKeyWord.if,
          filterText: QqlSequenceKeyWord.if,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: `${QqlSequenceKeyWord.if} \${1:condition} ${QqlSequenceKeyWord.else}`,
          range,
        },
      ]);
    }

    if (entry.includes(QqlSequenceKeyWord.if) && !this.ddlQuery) {
      return of([
        {
          label: QqlSequenceKeyWord.if,
          filterText: QqlSequenceKeyWord.if,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: `${QqlSequenceKeyWord.if} \${1:condition} ${QqlSequenceKeyWord.else}`,
          range,
        },
      ]);
    }

    if (entry.includes(QqlSequenceKeyWord.case.toLocaleLowerCase()) && !this.ddlQuery) {
      return of([
        {
          label: QqlSequenceKeyWord.case,
          filterText: QqlSequenceKeyWord.case,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: switchCaseSnippet,
          range,
        },
      ]);
    }

    return of([
      {
        label: entry.toUpperCase(),
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: entry.toUpperCase(),
        range: null,
      },
    ]);
  }

  private numToSSColumn(num: number): string {
    let s = '',
      t;

    while (num > 0) {
      t = (num - 1) % 26;
      s = String.fromCharCode(65 + t) + s;
      // tslint:disable-next-line:no-bitwise
      num = ((num - t) / 26) | 0;
    }
    return s || undefined;
  }

  private flatArrays<T>(arrays: T[][]): T[] {
    let result = [];
    arrays.forEach((part) => (result = result.concat(part)));
    return result;
  }

  private timeFormats(): Observable<string[]> {
    return of([
      '{YYYY}-{MM}-{DD} {HH}:{MM}:{ss}.{S}',
      '{YYYY}-{MM}-{DD} {HH}',
      '{YYYY}-{MM}-{DD}',
      '{YYYY}',
      '{YYYY} {TIMEZONE}',
      '{YYYY}-{MM}-{DD} {TIMEZONE}',
    ]);
  }

  private getSteamsSuggestions(range: IRange, addUnionKeyWord: boolean) {
      return this.streamsProvider$.pipe(
        map((streams) => {
          return streams.map((stream) => ({
            label: this.formatStream(stream),
            kind: monaco.languages.CompletionItemKind.Struct,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            insertText: (addUnionKeyWord ? ' ' : '') + 
              `${this.formatStream(stream)}` + 
             (addUnionKeyWord ? ` ${QqlSequenceKeyWord.union}` : ''),
            range,
          }));
        }),
        take(1),
      );
  }

  private formatStream(stream: string): string {
    return `"${stream}"`;
  }

  private getFunctions(): Observable<QueryFunction[]> {
    return this.functionsProvider$;
  }

  private getTypes() {
    return of([
      'INT8', 'INT16', 'INT32',	'INT64', 'FLOAT32',	'FLOAT64', 'DECIMAL',	
      'BOOLEAN', 'CHAR', 'TIMESTAMP(MS)', 'TIMESTAMP(NS)',	'VARCHAR',	'ENUM'
    ]);
  }

  private getColumns(streamList: string[] | null) {
    if (!streamList) {
      return of([]);
    }

    return this.streamsProvider$.pipe(
      map((existingStreams) => {
        return streamList
          .filter((stream) => !!stream && existingStreams.includes(stream))
          .map((stream) => stream.replace(/\"/g, ''));
      }),
      switchMap((streams) => {
        if (!streams.length) {
          return of([]);
        }
        const streams$ = streams.map((stream) => {
          if (!this.streamColumns[stream]) {
            this.streamColumns[stream] = this.columnsProvider(stream).pipe(
              map((columns) => columns
                .concat(this.alterAvailable$.getValue() ? ["timestampNs"] : [] )
                .concat(['symbol', "timestamp", 'type'])),
              shareReplay(1),
            );
          }
          return this.streamColumns[stream];
        });

        return combineLatest(...streams$).pipe(map(this.flatArrays), map(list => [...new Set(list)]));
      }),
    );
  }

  private getCursorPosition(model: ITextModel, position: IPosition) {
    let cursorPosition = 0;
    for (let i = 1; i < Math.min(model.getLineCount(), position.lineNumber); i++) {
      cursorPosition += model.getLineLength(i);
    }
    return cursorPosition + position.column - 1;
  }

  private getParts(
    value: string,
    cursorPosition: number,
  ): {left: string; word: string; right: string} {
    let position = cursorPosition - 1;
    while (value[position]?.trim()) {
      position--;
    }

    return {
      left: value.substr(0, position),
      right: value.substr(cursorPosition),
      word: value.substr(position, cursorPosition - position),
    };
  }

  private parseBlock(value: string, cursorPosition: number, syntaxGroups: QQLSyntaxGroup[], textBeforeCursor: string) {
    const editor = this.editor$.getValue();
    const model = editor.getModel();
    const position = editor.getPosition();
    const alterQuery = textBeforeCursor.includes(QqlSequenceKeyWord.alter);

    if (!model.getLineContent(position.lineNumber).trim() && alterQuery) {
      const filterKeyWords = [ QqlSequenceKeyWord.field ];
      if (![QqlSequenceKeyWord56.set, QqlSequenceKeyWord.class, QqlSequenceKeyWord.enum].some(w => textBeforeCursor.includes(w))) {
        filterKeyWords.push(QqlSequenceKeyWord.confirm);
      }
      return alterPatterns
        .filter(p => !filterKeyWords.includes(p.startWith as QqlSequenceKeyWord))
        .map(p => p.startWith);
    }

    let targetValue: string;
    let index: number;
    if (alterQuery) {
      const alterKeyWords = [QqlSequenceKeyWord.alter, QqlSequenceKeyWord56.set, 
        QqlSequenceKeyWord56.add, QqlSequenceKeyWord.drop, QqlSequenceKeyWord56.rewrite ] as string[];
      const lastKeyWord = textBeforeCursor.split(' ').filter(word => alterKeyWords.includes(word.trim())).pop().trim();
      targetValue = `${lastKeyWord?.toLowerCase()}${textBeforeCursor.split(lastKeyWord).pop().toLowerCase()}`;
      index = textBeforeCursor.lastIndexOf(lastKeyWord.trim());
    }

    const {match, presentGroups} = this.getGroup(syntaxGroups, targetValue ?? value, cursorPosition, index);
    const patternKeyWords = new Set<string>();
    const assumptions = new Set<string>();
    if (!match) {
      return this.getNextBlockWords(value, syntaxGroups, presentGroups, null);
    }

    match.group.patterns.forEach((pattern) =>
      pattern.split(' ').forEach((patternWord) => {
        if (!patternWord.startsWith('{')) {
          patternKeyWords.add(patternWord);
        }
        assumptions.add(patternWord);
      }),
    );

    const assumptionsReplacements = {
      '{expressionList}': '1',
      '{dataTypes}': '1',
      '{number}': '1',
      '{limitExpression}': '1',
      'count({number})': 'count(1)',
      'time({interval})': 'time(1)',
      '{interval}': '1',
      '{stream}': '"1"',
      '{enumValue}': '1',
      '{classOrEnum}': '1',
      '{classEnumOrField}': '1',
      '{typeName}': '"1"',
      '{fieldName}': '"1"',
      '{propertyName}': '1',
      '{entityName}': '"1"',
      '{confirmOptions}': '1',
    };

    const regexps = {
      '{expressionList}': '(?:(?!{keywords}).)+',
      '{dataTypes}': '(\\S+)',
      '{number}': '([0-9]+)',
      '{interval}': '(\\S+)',
      '{stream}': '(\\"[^"]+\\")',
      '{limitExpression}': '([0-9]+[\\s]*[,][\\s]*[0-9]+)',
      '{enumValue}': '\\S+',
      '{classOrEnum}': '\\S+',
      '{classEnumOrField}': '\\S+',
      '{typeName}': '(\\"\\S+\\")',
      '{fieldName}': '(\\"\\S+\\")',
      '{propertyName}': '\\S+',
      '{entityName}': '(\\"[\\S\\s]+\\")',
      '{confirmOptions}': '\\S+',
    };

    const parts = this.getParts(match.part, match.position);
    const keywords = [...patternKeyWords];
    const preparePattern = (pattern: string) => {
      let regExpStr = pattern.replace(/([\(\)])/g, '\\$1');
      pattern
        .match(/(\{[a-zA-Z0-9]+\})+/g)
        ?.forEach(
          (m) =>
            (regExpStr = regExpStr.replace(
              m,
              regexps[m].replace('{keywords}', keywords.length ? keywords.join('|') : '\\s'),
            )),
        );
      return regExpStr.split(' ');
    };
    const regExpFromArray = (words: string[]) => new RegExp(`^\\s*${words.join('\\s*')}\\s*$`);
    const results = [...assumptions]
      .map((word) => {
        let expression = `${parts.left} ${assumptionsReplacements[word] || word} ${
          parts.left.toUpperCase() === QqlSequenceKeyWord.as ? '' : parts.right}`;

        const alterInLowerCase = QqlSequenceKeyWord.alter.toLocaleLowerCase();
        if (expression.includes(alterInLowerCase)) {
          const expressionSplitted = expression.split(alterInLowerCase);
          expression = `${alterInLowerCase}${expressionSplitted[expressionSplitted.length - 1]}`;
        }
        return match.group.patterns.some((pattern) => {
          let regExpStr = pattern.replace(/([\(\)])/g, '\\$1');
          pattern
            .match(/(\{[a-zA-Z0-9]+\})+/g)
            ?.forEach(
              (m) =>
                (regExpStr = regExpStr.replace(
                  m,
                  regexps[m].replace('{keywords}', keywords.length ? keywords.join('|') : '\\s'),
                )),
            );

          const regExprParts = regExpStr.split(' ');
          const tmp = [];

          return regExprParts.some((regExprPart) => {
            tmp.push(regExprPart);
            return regExpFromArray(tmp).test(expression);
          });
        })
          ? word
          : null;
      })
      .filter(Boolean)
      .filter(word => word !== QqlSequenceKeyWord.alter);

    const fullMatch = match.group.patterns.some((pattern) => {
      return regExpFromArray(preparePattern(pattern)).test(`${parts.left} ${parts.right}`.trim());
    }) && !textBeforeCursor.endsWith('(');

    const textBeforeCursorTrimmed = textBeforeCursor.trim();
    const splitted = textBeforeCursor.split(' ').filter(Boolean);
    splitted.pop();
    const textBeforeSuggestion = splitted.join(' ');

    const streamUnionEnd = textBeforeSuggestion.endsWith('")') || textBeforeSuggestion.endsWith('" )');
    const nextWords = (fullMatch || streamUnionEnd)
      ? this.getNextBlockWords(value, syntaxGroups, presentGroups, match.group)
      : [];
    const removeEntityName = results.includes('{entityName}') && 
      (![QqlSequenceKeyWord.class, QqlSequenceKeyWord.enum, QqlSequenceKeyWord.field].some(word => textBeforeCursor.includes(word)) 
        || ['"', '('].some(char => textBeforeCursor.trim().endsWith(char)));

    if (textBeforeCursorTrimmed.endsWith('==')) {
      return ['{enumValue}'];
    }

    if ((textBeforeCursorTrimmed.endsWith(',') || textBeforeSuggestion.endsWith(',')) && !results.includes('{expressionList}')) {
      results.push('{expressionList}');
    }

    if (textBeforeCursorTrimmed.endsWith('"')) {
      results.push(QqlSequenceKeyWord.union);
    }

    return [ ...( removeEntityName ? results.filter(i => i !== '{entityName}') : results ), ...nextWords];
  }

  private getNextBlockWords(
    value: string,
    syntaxGroups: QQLSyntaxGroup[],
    presentGroups: QQLSyntaxGroup[],
    matchGroup: QQLSyntaxGroup,
  ): string[] {
    const nextWords = new Set<string>();
    if (!matchGroup) {
      if (QqlSequenceKeyWord.with.startsWith(value.toUpperCase())) {
        this.ddlQuery = false;
        return [QqlSequenceKeyWord.with];
      } else if (QqlSequenceKeyWord.create.startsWith(value.toUpperCase())) {
        this.ddlQuery = true;
        return [QqlSequenceKeyWord.create];
      } else if (QqlSequenceKeyWord.modify.startsWith(value.toUpperCase())) {
        this.ddlQuery = true;
        return [QqlSequenceKeyWord.modify]; 
      } else if (QqlSequenceKeyWord.alter.startsWith(value.toUpperCase()) && this.alterAvailable$.getValue()) {
        this.ddlQuery = true;
        return [QqlSequenceKeyWord.alter];
      } else if (QqlSequenceKeyWord.drop.startsWith(value.toUpperCase())) {
        this.ddlQuery = true;
        return [QqlSequenceKeyWord.drop];
      } else if (QqlSequenceKeyWord.select.startsWith(value.toUpperCase())) {
        this.ddlQuery = false;
        return [QqlSequenceKeyWord.select];
      }
    }

    const indexInPresents = presentGroups.findIndex((g) => g.startWith === matchGroup?.startWith);
    const presentAfter = presentGroups.slice(indexInPresents + 1).map((g) => g.startWith);
    let metCurrent = false;
    syntaxGroups.some((group) => {
      const started = metCurrent || !matchGroup;

      if (presentAfter.includes(group.startWith)) {
        return true;
      }

      if (started) {
        nextWords.add(group.startWith);
        group.optionalPrepend?.forEach((prependGroup) =>
          prependGroup.forEach((prepend) => nextWords.add(prepend)),
        );
      }

      if (group.required && started) {
        return true;
      }

      if (group.startWith === matchGroup?.startWith || !matchGroup) {
        metCurrent = true;
      }
    });

    return Array.from(nextWords);
  }

  private getGroup(
    syntaxGroups: QQLSyntaxGroup[],
    value: string,
    cursorPosition: number,
    index = 0
  ): {
    match: {position: number; part: string; group: QQLSyntaxGroup};
    presentGroups: QQLSyntaxGroup[];
  } {
    const regexps = [];
    const regExp = (flags = 'gis') => new RegExp(regexps.map((r) => r.r).join(''), flags);
    const presentGroups = [];
    for (const index in syntaxGroups) {
      const group = syntaxGroups[index];
      const regexpPart = `(\\s?${group.startWith}\\s+.*)`;
      regexps.push({r: regexpPart, g: {...group, index}});
      if (regExp().test(value)) {
        presentGroups.push(group);
      } else if (group.optionalPrepend) {
        const currentIndex = regexps.length - 1;
        let prependPassed = false;
        for (const op of group.optionalPrepend.reverse()) {
          const testRegex = `(\\s?(${op.join('|')})\\s+.*)`;
          const prev = regexps[currentIndex].r;
          regexps[currentIndex].r = testRegex;
          if (!regExp().test(value)) {
            regexps[currentIndex].r = prev;
          } else {
            prependPassed = true;
            break;
          }
        }

        if (!prependPassed) {
          regexps.splice(-1);
        }
      } else {
        regexps.splice(-1);
        if (group.required) {
          break;
        }
      }
    }

    let query = value;
    let start = index;
    let match;
    const matches = value.match(regExp('is'))?.splice(1);
    matches?.some((part, index) => {
      start += query.indexOf(part);
      const end = start + part.length;
      query = query.split(part)[1] || '';
      if (start <= cursorPosition && end >= cursorPosition) {
        match = {position: cursorPosition - start, part, group: regexps[index].g};
        return true;
      }
      start = end;
    });

    return {match, presentGroups};
  }

  private syntaxGroups(textBeforeCursor: string): Observable<QQLSyntaxGroup[]> {
    return of(null)
      .pipe(
        withLatestFrom(this.havingAndRecordsAvailable$),
        map(([, havingAndRecordsAvailable]) => {
          const selectPatterns = [
            'select {expressionList}',
            'select distinct {expressionList}',
            'select running {expressionList}',
            'select distinct running {expressionList}',
            'select running distinct {expressionList}',
            'select case {expressionList}'
          ];
          if (havingAndRecordsAvailable) {
            selectPatterns.push('select record {expressionList}')
          };
    
          const initPatterns = [
            {
              startWith: QqlSequenceKeyWord.with,
              patterns: ['with {expressionList}'],
            },
            {
              startWith: QqlSequenceKeyWord.create,
              patterns: ['create']
            },
            {
              startWith: QqlSequenceKeyWord.modify,
              patterns: [`modify stream {stream} (`]
            },
            {
              startWith: QqlSequenceKeyWord.alter,
              patterns: ['alter stream {stream} (']  
            },
            {
              startWith: QqlSequenceKeyWord.drop,
              patterns: [`drop stream {stream}`]
            },
            {
              startWith: QqlSequenceKeyWord.select,
              required: true,
              patterns: selectPatterns,
            },
          ];

          const ddlPatterns = [
            {
              startWith: QqlSequenceKeyWord.class,
              patterns: ['class']
            }
          ];

          const unionPattern = {
            startWith: QqlSequenceKeyWord.union,
            patterns: (textBeforeCursor?.includes('(') && !textBeforeCursor?.includes(')')) ? ['union {stream}'] : ['union'],
          };
      
          const qqlPatterns: QQLSyntaxGroup[] = [
            {
              startWith: QqlSequenceKeyWord.if,
              patterns: [
                'if {expressionList} else',
              ],
            },
            {
              startWith: QqlSequenceKeyWord.case,
              patterns: ['case {expressionList}'],
            },
            {
              startWith: QqlSequenceKeyWord.as,
              patterns: ['as {dataTypes}'],
            },
            {
              startWith: QqlSequenceKeyWord.from,
              patterns: ['from {stream}', 'from ( {stream}', 'from ( {stream} )'],
            },
            unionPattern,
            { startWith: QqlSequenceKeyWord.arrayJoin, patterns: ['array join {expressionList}'] },
            {
              startWith: QqlSequenceKeyWord.over,
              optionalPrepend: [[QqlSequenceKeyWord.trigger, QqlSequenceKeyWord.reset]],
              patterns: [
                'over count({number})',
                'trigger over count({number})',
                'over time({interval})',
                'over every time({interval})',
                'trigger over time({interval})',
                'trigger over every time({interval})',
                'reset over time({interval})',
                'reset over every time({interval})',
              ],
            },
            {
              startWith: QqlSequenceKeyWord.where, 
              patterns: ['where {expressionList}', 'where {expressionList} == {enumValue}']
            },
            {
              startWith: QqlSequenceKeyWord.groupBy, 
              patterns: havingAndRecordsAvailable ? 
                ['group by {expressionList}', 'group by having {expressionList}'] : ['group by {expressionList}'],
            },
            {
              startWith: QqlSequenceKeyWord.limit,
              patterns: ['limit {number} offset {number}', 'limit {limitExpression}'],
            },
            unionPattern
          ];
      
          if (havingAndRecordsAvailable) {
            qqlPatterns.push({
              startWith: QqlSequenceKeyWord56.having, 
              patterns: havingAndRecordsAvailable ? ['having {expressionList}'] : [],
            });
          }

          const alterKeyWordsInQuery = [
            QqlSequenceKeyWord56.set, 
            QqlSequenceKeyWord56.add, 
            QqlSequenceKeyWord.drop,
            QqlSequenceKeyWord56.rewrite]
              .some(keyWord => textBeforeCursor.includes(keyWord));
          // const secondAlterKeyWord = text.lastIndexOf(QqlSequenceKeyWord.alter) > 20;
          const longQuery = textBeforeCursor.split(' ').map(f => f.trim()).filter(Boolean).length > 3;
          if (textBeforeCursor.startsWith(QqlSequenceKeyWord.alter) && (longQuery || alterKeyWordsInQuery)) {
            return alterPatterns;
          } else {
            return [...initPatterns, ...(this.ddlQuery ? ddlPatterns : qqlPatterns)];
          }
    }));
  }
  
  private languageKey() {
    return `qql-${this.id}`;
  }

  private getLastTypedChar() {
    const cursorPosition = this.editor$.getValue().getPosition();
    const range = {
      endColumn: cursorPosition.column,
      endLineNumber: cursorPosition.lineNumber,
      startColumn: cursorPosition.column - 1,
      startLineNumber: cursorPosition.lineNumber,
    };
    return this.editor$.getValue().getModel().getValueInRange(range);
  }

  private getTextBeforeCursor() {
    const cursorPosition = this.editor$.getValue()?.getPosition();
    const range = {
      endColumn: cursorPosition.column,
      endLineNumber: cursorPosition.lineNumber,
      startColumn: 0,
      startLineNumber: 0,
    };
    return this.editor$.getValue().getModel().getValueInRange(range).replace(/(\r\n|\n|\r)/gm, '');
  }
}

function camelToSnakeCase(str: string) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}