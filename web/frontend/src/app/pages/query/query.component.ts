import {HttpErrorResponse} from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {GridOptions} from 'ag-grid-community';
import {IOutputData} from 'angular-split/lib/interface';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  ReplaySubject,
  Subscription,
  throwError,
} from 'rxjs';
import {
  catchError,
  filter,
  finalize,
  map,
  mapTo,
  skip,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import {AppState} from '../../core/store';
import {GridContextMenuService} from '../../shared/grid-components/grid-context-menu.service';
import {
  ExportTypes,
  GridDataStoreModel,
  GridTypes,
} from '../../shared/models/grid-data-store.model';
import {LastQuery} from '../../shared/models/last-query';
import {LiveGridFilters} from '../../shared/models/live-grid-filters';
import {MonacoEditorOptions} from '../../shared/models/qql-editor';
import {SchemaTypeModel} from '../../shared/models/schema.type.model';
import {RightPaneService} from '../../shared/right-pane/right-pane.service';
import {ExportService} from '../../shared/services/export.service';
import {GlobalResizeService} from '../../shared/services/global-resize.service';
import {GridService} from '../../shared/services/grid.service';
import {MonacoQqlConfigService} from '../../shared/services/monaco-qql-config.service';
import {ResizeObserveService} from '../../shared/services/resize-observe.service';
import {SchemaService} from '../../shared/services/schema.service';
import {StorageService} from '../../shared/services/storage.service';
import {StreamModelsService} from '../../shared/services/stream-models.service';
import {StreamsService} from '../../shared/services/streams.service';
import {TabStorageService} from '../../shared/services/tab-storage.service';
import {GridStateModel} from '../streams/models/grid.state.model';
import {StreamDetailsModel} from '../streams/models/stream.details.model';
import {StreamModel} from '../streams/models/stream.model';
import {LastQueriesService} from './services/last-queries.service';
import {QueryService} from './services/query.service';

@Component({
  selector: 'app-query',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss'],
  providers: [
    GridService,
    MonacoQqlConfigService,
    TabStorageService,
    GridContextMenuService,
    RightPaneService,
  ],
})
export class QueryComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  loading$ = new BehaviorSubject(false);
  pending$ = new BehaviorSubject(false);
  exporting$ = new BehaviorSubject(false);
  qqlError$ = new BehaviorSubject(false);
  gridOptions$: Observable<GridOptions>;
  gridState: GridStateModel;
  showGrid = false;
  queryError: string;
  sendBtnDisabled$: Observable<boolean>;
  exportBtnDisabled$: Observable<boolean>;
  sendBtnText$: Observable<string>;
  exportBtnText$: Observable<string>;
  editorOptions: MonacoEditorOptions;
  editorSize$: Observable<number>;
  gridSize$: Observable<number>;
  showDetails$: Observable<boolean>;
  lastQueries$: Observable<LastQuery[]>;
  gridTypes = GridTypes;
  gridType$ = new BehaviorSubject<GridTypes>(GridTypes.view);
  exportType$ = new BehaviorSubject<ExportTypes>(ExportTypes.qsmsg);
  rawSchema: {types: SchemaTypeModel[]; all: SchemaTypeModel[]};
  liveGridName$: Observable<string>;
  gridLiveFilters: LiveGridFilters;
  showLiveGrid$: Observable<boolean>;
  gridTypesArray = Object.values(GridTypes);
  exportTypesArray = Object.values(ExportTypes);
  @ViewChild('editorWrapper') private editorWrapper: ElementRef;
  private destroy$ = new ReplaySubject(1);
  private currentQuery: Subscription;
  private schema: SchemaTypeModel[];

  constructor(
    private fb: FormBuilder,
    private gridService: GridService,
    private queryService: QueryService,
    private storageService: StorageService,
    private activatedRoute: ActivatedRoute,
    private cdRef: ChangeDetectorRef,
    private tabStorageService: TabStorageService<GridDataStoreModel>,
    private monacoQqlConfigService: MonacoQqlConfigService,
    private schemaService: SchemaService,
    private translateService: TranslateService,
    private streamsService: StreamsService,
    private appStore: Store<AppState>,
    private globalResizeService: GlobalResizeService,
    private streamModelsService: StreamModelsService,
    private lastQueriesService: LastQueriesService,
    private resizeObserveService: ResizeObserveService,
    private exportService: ExportService,
    private messageInfoService: RightPaneService,
  ) {}

  ngOnInit() {
    this.showDetails$ = this.tabStorageService
      .flow('rightPanel')
      .getData(['selectedMessage'])
      .pipe(map((data) => !!data?.selectedMessage));

    this.showLiveGrid$ = this.gridType$.pipe(
      map((type) => [GridTypes.live, GridTypes.monitor].includes(type)),
    );

    this.createForm();
    this.gridService
      .infinityScroll((start, end) => {
        return this.tabId().pipe(
          take(1),
          switchMap((tabId) =>
            this.queryService.query(this.storageService.getExecutedQuery(tabId), start, end),
          ),
          map((data) => this.mapResponseData(data)),
        );
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();

    this.liveGridName$ = this.tabId().pipe(map((id) => `gridLive${id}`));
    this.gridOptions$ = this.tabId().pipe(map((tabId) => this.gridService.options(tabId)));
    this.gridService
      .onRowClicked()
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => this.messageInfoService.cellClicked(event));

    this.gridService
      .onPinnedChanged()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.messageInfoService.onPinnedRowDataChanged());

    this.gridService
      .onDoubleClicked()
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        this.messageInfoService.doubleClicked(event.data);
      });

    this.tabStorageService
      .getData(['exportType'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.exportType$.next(data?.exportType || ExportTypes.qsmsg);
      });

    this.tabStorageService
      .getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.messageInfoService.tabChanged();
      });

    this.tabStorageService
      .getData(['data', 'error', 'hideColumnsByDefault', 'gridType', 'query'])
      .pipe(
        tap((model) => {
          this.queryError = model?.error;
          this.qqlError$.next(!!model?.error);
          this.toggleGrid(!!model?.data);
        }),
        filter((model) => !!model?.data),
        takeUntil(this.destroy$),
      )
      .subscribe(({data: [schema, data, rawSchema], query, hideColumnsByDefault, gridType}) => {
        this.gridType$.next(gridType);

        switch (this.gridType$.getValue()) {
          case GridTypes.monitor:
          case GridTypes.live:
            this.rawSchema = rawSchema;
            this.gridLiveFilters = {
              symbols: null,
              space: null,
              fromTimestamp:
                this.gridType$.getValue() === GridTypes.live ? new Date().toISOString() : null,
              types: null,
              destination: `/user/topic/monitor-qql`,
              qql: query,
            };
            this.toggleGrid(true);
            return;
          case GridTypes.view:
            this.schema = schema;
            this.gridService.hideColumnsByDefault(hideColumnsByDefault);
            this.setGridData(schema, data);
            return;
        }
      });

    this.exportBtnDisabled$ = combineLatest([
      this.qqlError$,
      this.exporting$,
      this.form.valueChanges.pipe(startWith(null)),
    ]).pipe(map(([qqlError, exporting]) => qqlError || exporting || this.form.invalid));

    this.sendBtnDisabled$ = combineLatest([
      this.loading$,
      this.pending$,
      this.exportBtnDisabled$,
    ]).pipe(
      map(([loading, pending, exportBtnDisabled]) => (loading && !pending) || exportBtnDisabled),
    );

    this.editorOptions = this.monacoQqlConfigService.options();
    this.sendBtnText$ = combineLatest([this.pending$, this.gridType$]).pipe(
      switchMap(([pending, gridType]) =>
        this.translateService.get(`qqlEditor.buttons.${pending ? 'cancel' : gridType}`),
      ),
    );

    this.exportBtnText$ = this.exportType$.pipe(
      switchMap((type) => this.translateService.get(`qqlEditor.buttons.export.${type}`)),
    );

    this.lastQueries$ = this.lastQueriesService.getQueries();
    this.monacoQqlConfigService
      .onChange()
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe(() => this.qqlError$.next(false));
  }

  ngAfterViewInit() {
    this.editorSize$ = this.tabStorageService.getData(['editorSize']).pipe(
      map((data) => {
        return data?.editorSize === undefined ? 50 : data?.editorSize;
      }),
    );
    this.gridSize$ = this.editorSize$.pipe(map((size) => 100 - size));
    this.resizeObserveService
      .observe(this.editorWrapper.nativeElement)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.fitEditor());
  }

  onDragEnd({sizes}: IOutputData) {
    this.tabStorageService
      .updateData((data) => ({...data, editorSize: sizes[0] as number}))
      .subscribe();
  }

  fitEditor() {
    if (!this.editorWrapper) {
      return;
    }

    const wrapperRect = this.editorWrapper.nativeElement.getBoundingClientRect();
    this.monacoQqlConfigService.setSize({width: wrapperRect.width, height: wrapperRect.height});
  }

  onSubmit(gridType: GridTypes = null) {
    if (gridType) {
      this.gridType$.next(gridType);
    }

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
    this.messageInfoService.clearSelectedMessage();
    this.currentQuery = this.compileQuery()
      .pipe(
        tap(() => {
          this.pending$.next(true);
          this.cdRef.detectChanges();
        }),
        switchMap(() =>
          combineLatest([
            this.queryService.describe(formData.query),
            ![GridTypes.live, GridTypes.monitor].includes(this.gridType$.getValue())
              ? this.queryService.query(formData.query, 0, 100)
              : of([]),
          ]),
        ),
        catchError(this.onError()),
        finalize(() => {
          this.loading$.next(false);
          this.pending$.next(false);
          this.cdRef.detectChanges();
        }),
        switchMap(([schema, data]) =>
          this.tabStorageService.updateData((storageData) => ({
            ...storageData,
            hideColumnsByDefault: this.gridService.columnsHiddenByDefault,
            data: [
              this.streamModelsService.getSchemaForColumns(schema.types, schema.all),
              data,
              schema,
            ],
            gridType: this.gridType$.getValue(),
            query: this.form.get('query').value,
            error: null,
          })),
        ),
        switchMap(() => this.tabId().pipe(take(1))),
      )
      .subscribe((tabId) => {
        const query = this.form.getRawValue().query;
        this.lastQueriesService.add(
          [...new Set(this.monacoQqlConfigService.getStreams(query))],
          query?.trim(),
        );
        this.storageService.setExecutedQuery(tabId, query);
        this.cdRef.detectChanges();
      });
  }

  insertRecentQuery(query: LastQuery) {
    this.monacoQqlConfigService
      .onChangePosition()
      .pipe(take(1))
      .subscribe((position) => {
        this.monacoQqlConfigService.insertValue(query.query, position);
      });
  }

  onInit(editor) {
    const streams$ = this.streamsService
      .getListWithUpdates()
      .pipe(map((streams: StreamModel[]) => streams.map((stream) => stream.name)));

    this.monacoQqlConfigService.init(
      editor,
      streams$,
      (stream) =>
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
        ),
      [
        'int8',
        'int16',
        'int32',
        'int64',
        'decimal64',
        'decimal',
        'float32',
        'float64',
        'char',
        'boolean',
      ],
    );

    this.monacoQqlConfigService
      .onColumns()
      .pipe(takeUntil(this.destroy$))
      .subscribe((columns) => {
        this.gridService.hideColumnsByDefault(columns.includes('*'));
      });

    this.monacoQqlConfigService
      .onCtrlEnter()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onSubmit());

    this.fitEditor();
  }

  export(type: ExportTypes = null) {
    if (type) {
      this.exportType$.next(type);
    }
    this.exporting$.next(true);
    this.cdRef.detectChanges();
    this.exportType$
      .pipe(
        switchMap((exportType) =>
          this.tabStorageService.updateData((storageData) => ({
            ...storageData,
            exportType,
          })),
        ),
        switchMap(() => this.compileQuery()),
        catchError(this.onError()),
        switchMap(() =>
          this.queryService.export(this.form.get('query').value, this.exportType$.getValue()),
        ),
        switchMap(({id}) => this.exportService.downloadUrl(id)),
        take(1),
        finalize(() => this.exporting$.next(false)),
      )
      .subscribe((url) => {
        this.cdRef.detectChanges();
        location.href = url;
      });
  }

  private compileQuery(): Observable<null> {
    return this.queryService.compile(this.form.get('query').value).pipe(
      switchMap((response) => {
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

        return this.tabStorageService
          .updateData((storageData) => ({
            ...storageData,
            error: null,
          }))
          .pipe(mapTo(null));
      }),
    );
  }

  private onError() {
    return (errorResponse: HttpErrorResponse) => {
      return this.tabStorageService
        .updateData((data) => ({
          ...data,
          hideColumnsByDefault: this.gridService.columnsHiddenByDefault,
          data: null,
          query: null,
          error: errorResponse.error.message,
        }))
        .pipe(switchMap(() => throwError(errorResponse.error.message)));
    };
  }

  private setGridData(schema: SchemaTypeModel[], data: StreamDetailsModel[]) {
    this.gridService
      .setColumnsFromSchemaAndData(schema, this.mapResponseData(data))
      .pipe(
        switchMap(() => this.gridService.onGridReady()),
        take(1),
      )
      .subscribe((gridReady) => {
        this.toggleGrid(true);
        this.messageInfoService.setGridApi(gridReady);
      });
  }

  private mapResponseData(data: StreamDetailsModel[]): StreamDetailsModel[] {
    return this.streamModelsService.getStreamModels(data, this.schema);
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
      query: [
        null,
        (control: FormControl) => (control.value?.trim()?.length > 0 ? null : {required: true}),
      ],
    });

    this.tabId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((tabId) => {
        const stored = this.storageService.getQueryFilter(tabId);
        this.form.patchValue(stored || {query: null}, {emitEvent: false});
      });

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$), withLatestFrom(this.tabId()))
      .subscribe(([data, tabId]) => this.storageService.setQueryFilter(tabId, data));
  }
}
