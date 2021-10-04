import { Injectable }                                                             from '@angular/core';
import { Store }                                                                  from '@ngrx/store';
import { TranslateService }                                                                   from '@ngx-translate/core';
import { BehaviorSubject, combineLatest, Observable, of, ReplaySubject, Subject, throwError } from 'rxjs';
import { filter, map, shareReplay, switchMap, take, tap }                                     from 'rxjs/operators';
import * as NotificationsActions
                                                                                  from '../../core/modules/notifications/store/notifications.actions';
import { AppState }                                                               from '../../core/store';
import { MonacoEditorOptions, QqlSequenceKeyWord, QQLSyntaxGroup }                from '../models/qql-editor';
import { getClipboard, supportsReadFromClipboard }                                from '../utils/copy';
import { GlobalFiltersService }                                                   from './global-filters.service';
import { MonacoQqlTokensService }                                                 from './monaco-qql-tokens.service';
import { MonacoService }                                                          from './monaco.service';
import ITextModel = monaco.editor.ITextModel;
import IPosition = monaco.IPosition;
import IRange = monaco.IRange;
import CompletionItem = monaco.languages.CompletionItem;
import CompletionList = monaco.languages.CompletionList;

@Injectable()
export class MonacoQqlConfigService {
  private streamsProvider$: Observable<string[]>;
  private columnsProvider: (stream: string) => Observable<string[]>;
  private streamColumns: { [index: string]: Observable<string[]> } = {};
  private columns$ = new ReplaySubject<string[]>(1);
  private editor$ = new BehaviorSubject<any>(null);
  private decorations: string[];
  private disablePaste: boolean;
  private ctrlEnter$ = new Subject<void>();
  private dataTypes: string[];
  
  constructor(
    private monacoSqlTokensService: MonacoQqlTokensService,
    private monacoService: MonacoService,
    private translateService: TranslateService,
    private appStore: Store<AppState>,
    private globalFiltersService: GlobalFiltersService,
  ) {
    this.monacoService.registerLanguage('qql', {wordPattern: /([^\s]+)/g});
    this.monacoSqlTokensService.init();
    this.disablePaste = !supportsReadFromClipboard();
    this.monacoService.setAutoCompleteProvider('qql', this.getSuggestions.bind(this));
  }
  
  init(editor: any, streamsProvider$: Observable<string[]>, columnsProvider: (stream: string) => Observable<string[]>, dataTypes: string[]) {
    this.dataTypes = [...dataTypes.map(t => t.toLowerCase()), ...dataTypes.map(t => t.toUpperCase())];
    // For mac ctrl space bind on system call
    editor.addCommand(
      monaco.KeyMod.Alt | monaco.KeyCode.Space,
      () => editor.trigger('', 'editor.action.triggerSuggest', ''),
    );
    
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => this.ctrlEnter$.next(),
    );
    
    this.translateService.get('qqlEditor.paste').pipe(take(1)).subscribe(lang => {
      editor.addAction({
        id: 'paste',
        label: lang.title + (this.disablePaste ? ' ' + lang.notSupported : ''),
        keybindings: [],
        contextMenuGroupId: 'paste',
        run: editor => {
          getClipboard().pipe(take(1)).subscribe(text => {
            const selection = editor.getSelection();
            editor.executeEdits(null, [{
              range: selection,
              text: text,
              forceMoveMarkers: true,
            }]);
          }, error => {
            this.appStore.dispatch(new NotificationsActions.AddAlert({
              message: lang.denied,
              dismissible: true,
              closeInterval: 5000,
            }));
          });
        },
      });
    });
    
    this.streamsProvider$ = streamsProvider$;
    this.columnsProvider = columnsProvider;
    this.streamsProvider$.pipe(take(1)).subscribe(streams => this.monacoSqlTokensService.setStreams(streams.map(this.formatStream)));
    this.monacoSqlTokensService.setDataTypes(this.dataTypes);
    this.onContentChange(editor.getModel(), editor.getPosition());
    editor.onDidChangeModelContent(() => this.onContentChange(editor.getModel(), editor.getPosition()));
    this.editor$.next(editor);
  }
  
  setSize(size: { height: number, width: number }) {
    this.getEditor().subscribe(editor => editor.layout(size));
  }
  
  setError(range: IRange) {
    this.clearDecorations();
    this.getEditor().subscribe(editor => {
      this.decorations = editor.deltaDecorations([], [{range, options: {inlineClassName: 'sql-error'}}]);
      editor.setSelection(range);
      editor.focus();
    });
  }
  
  options(): MonacoEditorOptions {
    return {
      theme: 'qqlTheme',
      language: 'qql',
      automaticLayout: false,
      lineNumbers: 'off',
      extraEditorClassName: this.disablePaste ? 'disable-paste' : null,
      minimap: {
        enabled: false,
      },
    };
  }
  
  onCtrlEnter() {
    return this.ctrlEnter$.asObservable();
  }
  
  private getEditor(): Observable<any> {
    return this.editor$.pipe(filter(Boolean), take(1));
  }
  
  private onContentChange(model: ITextModel, position: IPosition) {
    this.clearDecorations();
    const streams = [];
    this.syntaxGroups().pipe(take(1)).subscribe(syntaxGroups => {
      const cursorPosition = this.getCursorPosition(model, position);
      this.getUnionBlocks(model).forEach(block => {
        const stream = this.getStream(block.text);
        if (stream) {
          streams.push(stream);
        }
        const columns = new Set<string>();
        const presentGroups = this.getGroup(syntaxGroups, block.text, cursorPosition - block.start).presentGroups;
        const afterKeyWords = [];
        const indexInPresents = presentGroups.findIndex(g => g.startWith === QqlSequenceKeyWord.select);
        if (indexInPresents === -1) {
          return;
        }
        
        const nextGroup = presentGroups[indexInPresents + 1];
        if (nextGroup) {
          afterKeyWords.push(nextGroup.startWith);
          nextGroup.optionalPrepend?.forEach(k => afterKeyWords.push(k));
        }
        const groupRegexp = afterKeyWords.length ? `(?:(?!${afterKeyWords.join('|')}).)+` : '(.*)';
        const columnsMatch = block.text.match(new RegExp(`select\\s+${groupRegexp}`, 'gi'));
        if (columnsMatch) {
          columnsMatch[0]
            .replace(/select/gi, '')
            .replace(/,/g, ' ')
            .split(' ')
            .map(f => f.trim())
            .filter(Boolean)
            .forEach(col => columns.add(col))
          ;
        }
        
        this.columns$.next([...columns]);
      });
      
      if (streams.length) {
        combineLatest(streams.map(stream => this.getColumns(stream))).pipe(
          take(1),
          map(this.flatArrays),
        ).subscribe((columns: string[]) => {
          this.monacoSqlTokensService.setFields(columns);
        });
      }
    });
  }
  
  onColumns(): Observable<string[]> {
    return this.columns$.asObservable();
  }
  
  private clearDecorations() {
    if (this.editor$.value && this.decorations) {
      this.editor$.value.deltaDecorations(this.decorations, []);
      this.decorations = null;
    }
  }
  
  private getSuggestions(model: ITextModel, position: IPosition): Observable<CompletionList> {
    const cursorPosition = this.getCursorPosition(model, position);
    const block = this.getUnionBlocks(model).find(block => block.start <= cursorPosition && block.end >= cursorPosition);
    return this.getBlockSuggestions(cursorPosition - block.start, block.text);
  }
  
  private getUnionBlocks(model: ITextModel) {
    const blockSeparator = QqlSequenceKeyWord.union;
    const value = model.getValue().replace(/(\r\n|\n|\r)/gm, '');
    const textBlocks = value.split(blockSeparator);
    let start = 0;
    return textBlocks.map(text => {
      const end = start + text.length;
      const block = {start, end, text};
      start = end + blockSeparator.length;
      return block;
    });
  }
  
  private getStream(text: string): string | null {
    return text.match(/select.*from\s+(?<stream>\S+)/i)?.groups.stream || null;
  }
  
  private getBlockSuggestions(cursorPosition: number, blockText: string): Observable<CompletionList> {
    const aliases = this.getAliases(blockText, cursorPosition);
    const stream = this.getStream(blockText);
    return this.syntaxGroups().pipe(
      switchMap(syntaxGroups => {
        const streams$ = this.parseBlock(blockText.toLowerCase(), cursorPosition, syntaxGroups).map(
          entry => this.getEntrySuggestions(entry, stream, aliases));
        return streams$.length ? combineLatest(streams$).pipe(map(this.flatArrays)) : of([]);
      }),
      map(suggestions => {
        if (! suggestions.length) {
          return {suggestions: [{label: '', insertText: ''}]};
        }
        
        return {suggestions: suggestions.map(s => ({...s, insertText: `${s.insertText} `}))};
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
    [...withoutWord.matchAll(/([a-z\.\"\']+)\s+as\s+([a-z0-9]+)[\s+|,]/ig)].forEach(match => aliases.add(match[2]));
    const dataTypeRegExp = new RegExp(this.dataTypes.join('|'), 'i');
    return [...aliases].filter(alias => !dataTypeRegExp.test(alias));
  }
  
  private getEntrySuggestions(entry: string, stream: string, aliases: string[]): Observable<CompletionItem[]> {
    if (['{limitExpression}', '{number}'].includes(entry)) {
      return of([]);
    }
    
    if (entry === QqlSequenceKeyWord.select) {
      return of([{
        label: QqlSequenceKeyWord.select,
        filterText: QqlSequenceKeyWord.select,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: `${QqlSequenceKeyWord.select} * FROM`,
        range: null,
      }]);
    }
    
    if (entry.includes('({')) {
      const regExp = /(\(\{[a-z]+\}\))/g;
      const label = `${entry.replace(regExp, '')}()`.toUpperCase();
      const snippet = entry.replace(regExp, '(${1})').toUpperCase();
      return of([{
        label: label,
        filterText: label,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        insertText: snippet,
        range: null,
      }]);
    }
    
    if (entry === '{stream}') {
      return this.getSteamsSuggestions();
    }
    
    if (entry === '{expressionList}') {
      const columns$ = stream ? this.getColumns(stream) : of([]);
      return combineLatest([
        columns$,
        this.timeFormats(),
        this.globalFiltersService.getFilters(),
      ]).pipe(take(1), map(([cols, timeFormats, filters]) => {
        const columns = [...cols, ...aliases].map(col => ({
          label: col.split('.').pop().replace(/"/g, ''),
          filterText: col,
          kind: monaco.languages.CompletionItemKind.Field,
          insertText: col,
          range: null,
        }));
        
        const timeFormatAutocomplete = timeFormats.map((format, formatIndex) => {
          const label = `'${format}'d`;
          let insertText = label;
          label.match(/(\{[a-z]+\})/gi).forEach((group, index) => {
            const fill = group.replace(/\{|\}/g, '');
            insertText = insertText.replace(group, `\${${index + 1}:${fill}}`);
          });
          
          const replaceTimeZone = (string) => string.replace(/TIMEZONE/g, filters.timezone[0].name);
          return {
            label: replaceTimeZone(label),
            filterText: `'`,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            insertText: replaceTimeZone(insertText),
            range: null,
            sortText: this.numToSSColumn(formatIndex + 1),
          };
        });
        return [
          ...columns,
          ...timeFormatAutocomplete,
        ];
      }));
    }
    
    return of([{
      label: entry.toUpperCase(),
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: entry.toUpperCase(),
      range: null,
    }]);
  }
  
  private numToSSColumn(num: number): string {
    let s = '', t;
  
    while (num > 0) {
      t = (num - 1) % 26;
      s = String.fromCharCode(65 + t) + s;
      // tslint:disable-next-line:no-bitwise
      num = (num - t) / 26 | 0;
    }
    return s || undefined;
  }
  
  private flatArrays<T>(arrays: T[][]): T[] {
    let result = [];
    arrays.forEach(part => result = result.concat(part));
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
  
  private getSteamsSuggestions() {
    return this.streamsProvider$.pipe(map(streams => {
      return streams.map(stream => ({
        label: this.formatStream(stream),
        kind: monaco.languages.CompletionItemKind.Struct,
        insertText: this.formatStream(stream),
        range: null,
      }));
    }));
  }
  
  private formatStream(stream: string): string {
    return `"${stream}"`;
  }
  
  private getColumns(streamString: string | null) {
    if (!streamString) {
      return of([]);
    }
    
    return this.streamsProvider$.pipe(
      map(existingStreams => existingStreams.map(this.formatStream)),
      map(existingStreams => {
        return streamString.split(' ')
          .map(stream => stream.trim())
          .filter(stream => !!stream && existingStreams.includes(stream))
          .map(stream => stream.replace(/\"/g, ''));
      }),
      switchMap(streams => {
        if (!streams.length) {
          return of([]);
        }
        const streams$ = streams.map(stream => {
          if (!this.streamColumns[stream]) {
            this.streamColumns[stream] = this.columnsProvider(stream).pipe(
              map(columns => columns.concat(['symbol', 'timestamp', 'type'])),
              shareReplay(1),
            );
          }
          return this.streamColumns[stream];
        });
        
        return combineLatest(...streams$).pipe(map(this.flatArrays));
      }),
    );
    
  }
  
  private getCursorPosition(model: ITextModel, position: IPosition) {
    let cursorPosition = 0;
    for (let i = 1; i < position.lineNumber; i++) {
      cursorPosition += model.getLineLength(i);
    }
    return cursorPosition + position.column - 1;
  }
  
  private getParts(value: string, cursorPosition: number): { left: string, word: string, right: string } {
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
  
  private parseBlock(value: string, cursorPosition: number, syntaxGroups: QQLSyntaxGroup[]) {
    const {match, presentGroups} = this.getGroup(syntaxGroups, value, cursorPosition);
    const patternKeyWords = new Set<string>();
    const assumptions = new Set<string>();
    if (!match) {
      return this.getNextBlockWords(syntaxGroups, presentGroups, null);
    }
    
    match.group.patterns.forEach(pattern => pattern.split(' ').forEach(patternWord => {
      if (!patternWord.startsWith('{')) {
        patternKeyWords.add(patternWord);
      }
      assumptions.add(patternWord);
    }));
    
    const assumptionsReplacements = {
      '{expressionList}': '1',
      '{number}': '1',
      '{limitExpression}': '1',
      'count({number})': 'count(1)',
      'time({interval})': 'time(1)',
      '{interval}': '1',
      '{stream}': '"1"',
    };
    
    const regexps = {
      '{expressionList}': '(?:(?!{keywords}).)+',
      '{number}': '([0-9]+)',
      '{interval}': '(\\S+)',
      '{stream}': '(\\"\\S+\\")',
      '{limitExpression}': '([0-9]+[\\s]*[,][\\s]*[0-9]+)',
    };
    
    const parts = this.getParts(match.part, match.position);
    const keywords = [...patternKeyWords];
    const preparePattern = (pattern: string) => {
      let regExpStr = pattern.replace(/([\(\)])/g, '\\$1');
      pattern.match(/(\{[a-zA-Z0-9]+\})+/g)?.forEach(
        m => regExpStr = regExpStr.replace(m, regexps[m].replace('{keywords}', (keywords.length ? keywords.join('|') : '\\s'))),
      );
      return regExpStr.split(' ');
    };
    const regExpFromArray = (words: string[]) => new RegExp(`^\\s*${words.join('\\s*')}\\s*$`);
    const results = [...assumptions].map(word => {
      
      const expression = `${parts.left} ${assumptionsReplacements[word] || word} ${parts.right}`;
      return match.group.patterns.some(pattern => {
        let regExpStr = pattern.replace(/([\(\)])/g, '\\$1');
        pattern.match(/(\{[a-zA-Z0-9]+\})+/g)?.forEach(
          m => regExpStr = regExpStr.replace(m, regexps[m].replace('{keywords}', keywords.length ? keywords.join('|') : '\\s')),
        );
        
        const regExprParts = regExpStr.split(' ');
        const tmp = [];
        
        return regExprParts.some(regExprPart => {
          tmp.push(regExprPart);
          return regExpFromArray(tmp).test(expression);
        });
      }) ? word : null;
    }).filter(Boolean);
    
    const fullMatch = match.group.patterns.some(pattern => {
      return regExpFromArray(preparePattern(pattern)).test(`${parts.left} ${parts.right}`.trim());
    });
    
    const nextWords = fullMatch ? this.getNextBlockWords(syntaxGroups, presentGroups, match.group) : [];
    return [...results, ...nextWords];
  }
  
  private getNextBlockWords(syntaxGroups: QQLSyntaxGroup[], presentGroups: QQLSyntaxGroup[], matchGroup: QQLSyntaxGroup): string[] {
    const nextWords = [];
    if (!matchGroup) {
      return [QqlSequenceKeyWord.select];
    }
    
    const indexInPresents = presentGroups.findIndex(g => g.startWith === matchGroup?.startWith);
    const presentAfter = presentGroups.slice(indexInPresents + 1).map(g => g.startWith);
    let metCurrent = false;
    syntaxGroups.some(group => {
      const started = metCurrent || !matchGroup;
      
      if (presentAfter.includes(group.startWith)) {
        return true;
      }
      
      if (started) {
        nextWords.push(group.startWith);
        group.optionalPrepend?.forEach(prependGroup => prependGroup.forEach(prepend => nextWords.push(prepend)));
      }
      
      if (group.required && started) {
        return true;
      }
      
      if (group.startWith === matchGroup?.startWith || !matchGroup) {
        metCurrent = true;
      }
    });
    
    return nextWords;
  }
  
  private getGroup(syntaxGroups: QQLSyntaxGroup[], value: string, cursorPosition: number): { match: { position: number, part: string, group: QQLSyntaxGroup }, presentGroups: QQLSyntaxGroup[] } {
    const regexps = [];
    const regExp = (flags = 'gis') => new RegExp(regexps.map(r => r.r).join(''), flags);
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
    let start = 0;
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
  
  private syntaxGroups(): Observable<QQLSyntaxGroup[]> {
    /**
     *
     [WITH expr]
     SELECT [DISTINCT | RUNNING] expr.
     [FROM stream]
     [ARRAY JOIN expr]
     [TRIGGER OVER [EVERY] TIME(interval literal) | COUNT(number)]
     [RESET OVER [EVERY] TIME(interval literal)]
     [OVER [EVERY] TIME(interval literal) | COUNT(number)]
     [WHERE expr]
     [GROUP BY expr]
     [LIMIT [number1, ]number2 | LIMIT number1 OFFSET number2]
     [UNION ...]
     
     
     trigger -> time|count, reset -> time
     time optional every
     */
    return of([
      {
        startWith: QqlSequenceKeyWord.with, patterns: ['with {expressionList}'],
      },
      {
        startWith: QqlSequenceKeyWord.select,
        required: true,
        patterns: [
          'select {expressionList}',
          'select distinct {expressionList}',
          'select running {expressionList}',
          'select distinct running {expressionList}',
          'select running distinct {expressionList}',
        ],
      },
      {
        startWith: QqlSequenceKeyWord.from,
        patterns: ['from {stream}'],
      },
      {startWith: QqlSequenceKeyWord.arrayJoin, patterns: ['array join {expressionList}']},
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
      {startWith: QqlSequenceKeyWord.where, patterns: ['where {expressionList}']},
      {startWith: QqlSequenceKeyWord.groupBy, patterns: ['group by {expressionList}']},
      {
        startWith: QqlSequenceKeyWord.limit, patterns: [
          'limit {number} offset {number}',
          'limit {limitExpression}',
        ],
      },
      {startWith: QqlSequenceKeyWord.union, patterns: ['union']},
    ]);
  }
}
