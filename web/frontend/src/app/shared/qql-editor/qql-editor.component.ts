import {
  AfterViewInit, ChangeDetectorRef,
  Component,
  ElementRef, EventEmitter,
  forwardRef,
  Injector,
  OnDestroy,
  OnInit, Output,
  ViewChild, Input, OnChanges, SimpleChanges
} from '@angular/core';
import { ControlValueAccessor, UntypedFormControl, NG_VALUE_ACCESSOR, NgControl, Validators } from '@angular/forms';
import { EditorComponent }                                   from 'ngx-monaco-editor';
import { Observable, ReplaySubject, timer, of }                                    from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, filter, map, shareReplay, switchMap, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { QueryFunction }                                           from '../../pages/query/query-function';
import { QueryService }                                                                from '../../pages/query/services/query.service';
import { StreamModel }                                                                 from '../../pages/streams/models/stream.model';
import { MonacoEditorOptions }                                                         from '../models/qql-editor';
import { MonacoQqlConfigService, dataTypes }                                                      from '../services/monaco-qql-config.service';
import { QqlService }                                                                  from '../services/qql.service';
import { ResizeObserveService }                                                        from '../services/resize-observe.service';
import { SchemaService }                                                               from '../services/schema.service';
import { StreamsService }                                                              from '../services/streams.service';
import { TabModel } from 'src/app/pages/streams/models/tab.model';
import { Store, select } from '@ngrx/store';
import { AppState } from 'src/app/core/store';
import { getActiveOrFirstTab } from 'src/app/pages/streams/store/streams-tabs/streams-tabs.selectors';
import IRange = monaco.IRange;

@Component({
  selector: 'app-qql-editor',
  templateUrl: './qql-editor.component.html',
  styleUrls: ['./qql-editor.component.scss'],
  providers: [
    {provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => QqlEditorComponent)},
  ],
})
export class QqlEditorComponent implements OnInit, AfterViewInit, OnDestroy, ControlValueAccessor, OnChanges {
  
  @ViewChild(EditorComponent, {read: ElementRef}) private editorEl: ElementRef;
  
  @Input() requestError = false;
  @Input() selectedRange: IRange;
  @Input() selectedText = '';
  @Input() errorInsideSelectedText: boolean;
  
  @Output() validUpdate = new EventEmitter();
  @Output() onQueryChange = new EventEmitter<{ text: string, error: boolean }>();
  @Output() removeRequestError = new EventEmitter();
  @Output() setEditorAsReady = new EventEmitter();
  @Output() setEditor = new EventEmitter();
  @Output() setError = new EventEmitter();
  @Output() setQueryError = new EventEmitter<boolean>();
  
  editorOptions: MonacoEditorOptions;
  control = new UntypedFormControl();
  selfControl: UntypedFormControl;
  queryError: string;
  showQueryError: boolean;
  queryRequestError: boolean;
  private contextMenuSubscription;
  private currentTab$: Observable<TabModel>;
  private currentTabId: string;
  
  private destroy$ = new ReplaySubject(1);
  
  constructor(
    private streamsService: StreamsService,
    private schemaService: SchemaService,
    private qqlService: QqlService,
    private monacoQqlConfigService: MonacoQqlConfigService,
    private resizeObserveService: ResizeObserveService,
    private injector: Injector,
    private queryService: QueryService,
    private cdRef: ChangeDetectorRef,
    private appStore: Store<AppState>,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.queryRequestError = changes.requestError?.currentValue;
  }
  
  ngOnInit(): void {
    this.currentTab$ = this.appStore.pipe(select(getActiveOrFirstTab));
    this.editorOptions = this.monacoQqlConfigService.options();
    this.control.valueChanges
      .pipe(debounceTime(400), takeUntil(this.destroy$), distinctUntilChanged(), withLatestFrom(this.currentTab$))
      .subscribe(([value, tab]) => {
        this.showQueryError = false;
        if (this.currentTabId && this.currentTabId === tab.id) {
          this.queryRequestError = false;
          this.removeRequestError.next();
          this.onChange(value);
        } else {
          this.currentTabId = tab?.id;
        }
      })
  }
  
  ngAfterViewInit() {
    this.selfControl = this.injector.get(NgControl).control as UntypedFormControl;
    this.selfControl.setValidators([Validators.required]);
    this.selfControl.updateValueAndValidity();

    this.control.setValidators([Validators.required]);
    this.control.setAsyncValidators([this.validateQuery()]);
    this.control.updateValueAndValidity();
    this.control.valueChanges
      .pipe(filter(value => !value))
      .subscribe(() => this.onQueryChange.next({ text: '', error: true }));

    this.fitEditor();
    this.resizeObserveService.observe(this.editorEl.nativeElement).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.fitEditor();
    });
  }
  
  editorInit(editor) {
    this.setEditor.emit(editor);
    
    const streams$ = this.streamsService
      .getListWithUpdates()
      .pipe(map((streams: StreamModel[]) => streams.map((stream) => stream.name)));
    
    const columns = (stream) =>
      this.schemaService.getSchema(stream).pipe(
        map(({types, all}) => {
          const result = [];
          const fieldNamesCount = {};
          const shortTypeNameCount = {};
          const shortTypeName = (typeName: string, fieldName: string) =>
            `${typeName.split('.').pop()}:${fieldName}`;
          all.forEach((type) => {
            type.fields.forEach((field) => {
              fieldNamesCount[field.name] =
                fieldNamesCount[field.name] !== undefined ? fieldNamesCount[field.name] + 1 : 1;
              const alias = shortTypeName(type.name, field.name);
              shortTypeNameCount[alias] =
                shortTypeNameCount[alias] !== undefined ? shortTypeNameCount[alias] + 1 : 1;
            });
          });
          
          types.forEach((type) => {
            type.fields.forEach((field) => {
              const shortAlias = shortTypeName(type.name, field.name);
              if (fieldNamesCount[field.name] === 1) {
                result.push(field.name);
              } else if (shortTypeNameCount[shortAlias] === 1) {
                result.push(shortAlias);
              } else {
                result.push(`"${type.name}":${field.name}`);
              }
            });
          });
          
          return result;
        }),
      );
    
    const functions$ = this.qqlService.functions().pipe(
      map((functions) => {
        const unique = new Map<string, QueryFunction>();
        functions.forEach((f) => unique.set(`${f.name}-${f.stateful ? '1' : '0'}-${JSON.stringify(f.initArguments)}`, f));
        return [...unique.values()];
      }),
      shareReplay(1),
    );
    
    this.monacoQqlConfigService.init(editor, streams$, columns, functions$, [
      'INT8', 'INT16', 'INT32',	'INT64', 'FLOAT32',	'FLOAT64', 'DECIMAL', 'DECIMAL64',	
      'BOOLEAN', 'CHAR', 'TIMESTAMP(MS)', 'TIMESTAMP(NS)',	'VARCHAR',	'ENUM'
    ]);
    this.monacoQqlConfigService.init(editor, streams$, columns, functions$, dataTypes);

    this.contextMenuSubscription = editor.onContextMenu((e) => {
      const contextMenuElement = editor.getDomNode().querySelector(".monaco-menu-container") as HTMLElement;
    
      if (contextMenuElement) {
        const posY = (e.event.posy + contextMenuElement.clientHeight) > window.outerHeight
          ? e.event.posy - contextMenuElement.clientHeight
          : e.event.posy;
    
        const posX = (e.event.posx + contextMenuElement.clientWidth) > window.outerWidth
          ? e.event.posx - contextMenuElement.clientWidth
          : e.event.posx;
    
        contextMenuElement.style.position = "fixed";
        contextMenuElement.style.top =  Math.max(0, Math.floor(posY)) + "px";
        contextMenuElement.style.left = Math.max(0, Math.floor(posX)) + "px";
      }
    });
  }
  
  fitEditor() {
    const wrapperRect = this.editorEl.nativeElement.getBoundingClientRect();
    this.monacoQqlConfigService.setSize({width: wrapperRect.width, height: wrapperRect.height});
  }
  
  ngOnDestroy(): void {
    this.contextMenuSubscription?.dispose();
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: () => void): void {
  }
  
  writeValue(value: string): void {
    this.monacoQqlConfigService.tokenizerInit().pipe(take(1)).subscribe(() => {
      this.control.patchValue(value, {emitEvent: false});
      this.setEditorAsReady.next();
    });
  }
  
  private onChange(value: string) {}

  validateQueryText(query: string, selectedRange) {
    if (!query) {
      this.queryError = 'Query is empty';
      this.setQueryError.emit(!!this.queryError);
      this.showQueryError = true;
      this.onQueryChange.next({ text: '', error: true });
      return of(false);
    }
    
    return this.queryService.compile(query).pipe(
      delay(1000),
      map(response => {
      
      const location = response?.errorLocation;
      if (location) {
        let errorLocation = {
          startLineNumber: location.startLine + 1,
          endLineNumber: location.endLine + 1,
          startColumn: location.startPosition + 1,
          endColumn: location.endPosition + 1,
        };

        const selectedRangeValid = (selectedRange.startLineNumber !== selectedRange.endLineNumber 
          || selectedRange.startColumn !== selectedRange.endColumn) &&
          (selectedRange.startLineNumber !== 1 || selectedRange.startColumn !== 1);

        if (selectedRangeValid) {
          if (selectedRange.startColumn === 1) {
            errorLocation = {
              ...errorLocation,
              startLineNumber: errorLocation.startLineNumber + selectedRange.startLineNumber - 1,
              endLineNumber: errorLocation.endLineNumber + selectedRange.startLineNumber - 1,
            };
          } else {
            errorLocation = {
              startLineNumber: errorLocation.startLineNumber + selectedRange.startLineNumber - 1,
              endLineNumber: errorLocation.endLineNumber + selectedRange.startLineNumber - 1,
              startColumn: errorLocation.startColumn + selectedRange.startColumn - 1,
              endColumn: errorLocation.endColumn + 
                (errorLocation.startLineNumber === errorLocation.endLineNumber ? selectedRange.startColumn : 0) - 1
            };
          }
        }
        this.monacoQqlConfigService.setError(errorLocation, false, this.selectedRange, true);
        this.setError.emit(errorLocation);
      } else if (!location && response.error) {
        this.monacoQqlConfigService.setError(this.selectedRange, false, this.selectedRange, true);
        this.setError.emit(this.selectedRange);
      } else {
        // console.log('here');
        // const empty = {
        //   startLineNumber: 0,
        //   endLineNumber: 0,
        //   startColumn: 0,
        //   endColumn: 0,
        // }
        // this.monacoQqlConfigService.setError(empty, false, this.selectedRange, true);
        // this.setError.emit(empty);
      }
      
      if (!this.selectedText) {
        this.queryError = response?.error;
        this.setQueryError.emit(!!this.queryError);
        this.showQueryError = !!response?.error;
      }

      timer().subscribe(() => {
        this.cdRef.detectChanges();
        this.validUpdate.next();
        this.onQueryChange.next({ text: query, error: !!response?.error });
      });
      return !response?.error;
    }));
  }
  
  private validateQuery() {
    return (control: UntypedFormControl) => {
      if (!control.value.trim()) {
        this.queryError = 'Query is empty';
        this.setQueryError.emit(!!this.queryError);
        this.showQueryError = true;
        this.onQueryChange.next({ text: '', error: true });
        return of({queryError: true});
      }
      
      return timer(500).pipe(switchMap(() => {
        return this.queryService.compile(control.value).pipe(
          delay(1000),
          map(response => {
          
            const location = response?.errorLocation;
            if (location) {
              const errorLocation = {
                startLineNumber: location.startLine + 1,
                endLineNumber: location.endLine + 1,
                startColumn: location.startPosition + 1,
                endColumn: location.endPosition + 1,
              };
              this.monacoQqlConfigService.setError(errorLocation, false, this.selectedRange);
              this.setError.emit(errorLocation);
            } else {
              const empty = {
                startLineNumber: 0,
                endLineNumber: 0,
                startColumn: 0,
                endColumn: 0,
              }
              this.monacoQqlConfigService.setError(empty, false, this.selectedRange);
              this.setError.emit(empty);
            }

            this.queryError = response?.error;
            this.setQueryError.emit(!!this.queryError);
            this.showQueryError = !!response?.error;
            timer().subscribe(() => {
              this.cdRef.detectChanges();
              this.validUpdate.next();
              this.onQueryChange.next({ text: control.value, error: !!response?.error });
            });
            return response?.error ? {queryError: true} : null;
          })
        );
      }));
    };
  }
}
