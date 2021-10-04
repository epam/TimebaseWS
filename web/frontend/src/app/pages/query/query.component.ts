import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
}                                                                                     from '@angular/forms';
import { select, Store }                                                              from '@ngrx/store';
import { IOutputData }                                                                from 'angular-split/lib/interface';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  ReplaySubject,
  Subscription,
  throwError,
}                                                                                     from 'rxjs';
import {
  GridOptions,
}                                                                                     from 'ag-grid-community';
import {
  catchError,
  delay,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  startWith,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom,
}                                 from 'rxjs/operators';
import { AppState }               from '../../core/store';
import { GridContextMenuService } from '../../shared/grid-components/grid-context-menu.service';
import { GlobalResizeService }    from '../../shared/services/global-resize.service';
import { GridService }            from '../../shared/services/grid.service';
import { GridStateModel }         from '../streams/models/grid.state.model';
import { SetSelectedMessage }     from '../streams/store/seletcted-message/selected-message.actions';
import { getActiveTabSettings }   from '../streams/store/streams-tabs/streams-tabs.selectors';
import { QueryService }           from './services/query.service';
import { StorageService }         from '../../shared/services/storage.service';
import { ActivatedRoute }         from '@angular/router';
import { StreamDetailsModel }     from '../streams/models/stream.details.model';
import { BsModalService }         from 'ngx-bootstrap/modal';
import { SchemaTypeModel }                                                            from '../../shared/models/schema.type.model';
import { TabStorageService }                                                          from '../../shared/services/tab-storage.service';
import { HttpErrorResponse }                                                          from '@angular/common/http';
import { MonacoQqlConfigService }                                                     from '../../shared/services/monaco-qql-config.service';
import { SchemaService }                                                              from '../../shared/services/schema.service';
import { StreamModel }                                                                from '../streams/models/stream.model';
import { MonacoEditorOptions }                                                        from '../../shared/models/qql-editor';
import { TranslateService }                                                           from '@ngx-translate/core';
import { StreamsService }                                                             from '../../shared/services/streams.service';
import { GridDataStoreModel }                                                         from '../../shared/models/grid-data-store.model';

@Component({
  selector: 'app-query',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss'],
  providers: [GridService, MonacoQqlConfigService, TabStorageService, GridContextMenuService],
})
export class QueryComponent implements OnInit, AfterViewInit {
  
  @ViewChild('editorWrapper') private editorWrapper: ElementRef;
  
  form: FormGroup;
  loading$ = new BehaviorSubject(false);
  pending$ = new BehaviorSubject(false);
  gridOptions$: Observable<GridOptions>;
  gridState: GridStateModel;
  showGrid = false;
  queryError: string;
  sendBtnDisabled$: Observable<boolean>;
  sendBtnText$: Observable<string>;
  editorOptions: MonacoEditorOptions;
  editorSize$: Observable<number>;
  gridSize$: Observable<number>;
  showDetails$: Observable<boolean>;
  
  private destroy$ = new ReplaySubject(1);
  private currentQuery: Subscription;
  
  constructor(
    private fb: FormBuilder,
    private gridService: GridService,
    private queryService: QueryService,
    private storageService: StorageService,
    private activatedRoute: ActivatedRoute,
    private bsModalService: BsModalService,
    private cdRef: ChangeDetectorRef,
    private tabStorageService: TabStorageService<GridDataStoreModel>,
    private monacoQqlConfigService: MonacoQqlConfigService,
    private schemaService: SchemaService,
    private translateService: TranslateService,
    private streamsService: StreamsService,
    private appStore: Store<AppState>,
    private globalResizeService: GlobalResizeService,
  ) {
  }
  
  ngOnInit() {
    this.showDetails$ = this.appStore
      .pipe(
        select(getActiveTabSettings),
      ).pipe(
        map(settings => settings?.showMessageInfo),
      );
    
    this.showDetails$.pipe(takeUntil(this.destroy$), distinctUntilChanged(), delay(0)).subscribe(() => this.fitEditor());
    
    this.createForm();
    this.gridOptions$ = this.tabId().pipe(map((tabId) => this.gridService.options(tabId)));
    this.gridService.onDoubleClicked().pipe(
      takeUntil(this.destroy$),
    ).subscribe(params => this.appStore.dispatch(SetSelectedMessage({selectedMessage: params.data})));
    
    this.tabStorageService.getData(['data', 'error', 'hideColumnsByDefault']).pipe(
      tap(model => {
        this.queryError = model?.error;
        this.toggleGrid(!!model?.data);
      }),
      filter(model => !!model?.data),
      takeUntil(this.destroy$),
    ).subscribe(({data: [schema, data], hideColumnsByDefault}) => {
      this.gridService.hideColumnsByDefault(hideColumnsByDefault);
      this.setGridData(schema, data);
    });
    
    this.sendBtnDisabled$ = combineLatest([
      this.loading$,
      this.pending$,
      this.form.valueChanges.pipe(startWith(null)),
    ]).pipe(map(([loading, pending]) => (loading && !pending) || this.form.invalid));
    
    this.editorOptions = this.monacoQqlConfigService.options();
    this.sendBtnText$ = this.pending$.pipe(
      switchMap(pending => this.translateService.get(`buttons.${pending ? 'cancel' : 'send'}`)),
    );
    
    this.globalResizeService.onProgress().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.fitEditor();
    });
  }
  
  ngAfterViewInit() {
    this.editorSize$ = this.tabStorageService.getData(['editorSize']).pipe(map(data => {
      return data?.editorSize === undefined ? 50 : data?.editorSize;
    }));
    this.gridSize$ = this.editorSize$.pipe(map(size => 100 - size));
    
    this.editorSize$.pipe(takeUntil(this.destroy$), delay(0)).subscribe(() => this.fitEditor());
  }
  
  onDragEnd({sizes}: IOutputData) {
    this.tabStorageService.updateData(data => ({...data, editorSize: sizes[0] as number})).subscribe();
  }
  
  onDragProgress() {
    this.fitEditor();
  }
  
  fitEditor() {
    if (!this.editorWrapper) {
      return;
    }
    
    const wrapperRect = this.editorWrapper.nativeElement.getBoundingClientRect();
    this.monacoQqlConfigService.setSize({width: wrapperRect.width, height: wrapperRect.height});
  }
  
  onSubmit() {
    if (this.pending$.getValue()) {
      this.currentQuery.unsubscribe();
      return;
    }
    
    if (this.form.invalid) {
      return;
    }
    
    this.loading$.next(true);
    this.cdRef.detectChanges();
    const formData = this.form.getRawValue();
    
    this.currentQuery = this.queryService.compile(formData.query).pipe(
      switchMap(response => {
        if (response.error) {
          if (response.errorLocation) {
            this.monacoQqlConfigService.setError({
              startLineNumber: response.errorLocation.startLine + 1,
              endLineNumber: response.errorLocation.endLine + 1,
              startColumn: response.errorLocation.startPosition + 1,
              endColumn: response.errorLocation.endPosition + 1,
            });
          }
          return throwError({error: {message: response.error}});
        }
        
        return of(null);
      }),
      tap(() => {
        this.pending$.next(true);
        this.cdRef.detectChanges();
      }),
      switchMap(() => combineLatest([
        this.queryService.describe(formData.query).pipe(map(response => response.types)),
        this.queryService.query(formData.query, 0, formData.rows),
      ])),
      catchError((errorResponse: HttpErrorResponse) => {
        return this.tabStorageService.updateData(data => ({
          ...data,
          hideColumnsByDefault: this.gridService.columnsHiddenByDefault,
          data: null,
          error: errorResponse.error.message,
        })).pipe(
          switchMap(() => throwError(errorResponse.error.message)),
        );
      }),
      finalize(() => {
        this.loading$.next(false);
        this.pending$.next(false);
        this.cdRef.detectChanges();
      }),
      switchMap(data => this.tabStorageService.updateData(storageData => ({
        ...storageData,
        hideColumnsByDefault: this.gridService.columnsHiddenByDefault,
        data,
        error: null,
      }))),
    ).subscribe();
  }
  
  onInit(editor) {
    const streams$ = this.streamsService.getList(true).pipe(
      map((streams: StreamModel[]) => streams.map(stream => stream.name)),
    );
    
    this.monacoQqlConfigService.init(
      editor,
      streams$,
      stream => this.schemaService.getSchema(stream).pipe(map(({types, all}) => {
        const result = [];
        const fieldNamesCount = {};
        const shortTypeNameCount = {};
        const shortTypeName = (typeName: string, fieldName: string) => `${typeName.split('.').pop()}:${fieldName}`;
        all.forEach(type => {
          type.fields.forEach(field => {
            fieldNamesCount[field.name] = fieldNamesCount[field.name] !== undefined ? fieldNamesCount[field.name] + 1 : 1;
            const alias = shortTypeName(type.name, field.name);
            shortTypeNameCount[alias] = shortTypeNameCount[alias] !== undefined ? shortTypeNameCount[alias] + 1 : 1;
          });
        });
        
        types.forEach(type => {
          type.fields.forEach(field => {
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
      })),
      ['int8', 'int16', 'int32', 'int64', 'decimal64', 'decimal', 'float32', 'float64', 'char', 'boolean'],
    );
    
    this.monacoQqlConfigService.onColumns().pipe(takeUntil(this.destroy$)).subscribe(columns => {
      this.gridService.hideColumnsByDefault(columns.includes('*'));
    });
    
    this.monacoQqlConfigService.onCtrlEnter().pipe(takeUntil(this.destroy$)).subscribe(
      () => this.onSubmit(),
    );
    this.fitEditor();
  }
  
  private setGridData(schema: SchemaTypeModel[], data: StreamDetailsModel[]) {
    this.gridService.setColumnsFromSchemaAndData(
      schema,
      data.map(row => new StreamDetailsModel(row)),
    ).subscribe(() => this.toggleGrid(true));
  }
  
  private toggleGrid(state: boolean) {
    this.showGrid = state;
    this.cdRef.detectChanges();
  }
  
  private tabId(): Observable<string> {
    return this.activatedRoute.params.pipe(map(({id}) => id));
  }
  
  private createForm() {
    this.form = this.fb.group({
      rows: [100, [Validators.required, Validators.min(1)]],
      query: [null, Validators.required],
    });
    
    this.tabId().pipe(takeUntil(this.destroy$)).subscribe(tabId => {
      const stored = this.storageService.getQueryFilter(tabId);
      this.form.patchValue(stored || {rows: 100, query: null}, {emitEvent: false});
    });
    
    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
      withLatestFrom(this.tabId()),
    ).subscribe(([data, tabId]) => this.storageService.setQueryFilter(tabId, data));
  }
}
