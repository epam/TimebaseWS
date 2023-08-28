import { HttpClient }       from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
}                                              from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router }              from '@angular/router';
import { select, Store }                       from '@ngrx/store';
import { TranslateService }                    from '@ngx-translate/core';
import { GridOptions }                         from 'ag-grid-community';
import { IOutputData }                         from 'angular-split/lib/interface';
import { BsDropdownDirective }                 from 'ngx-bootstrap/dropdown';
import { BsModalService }                      from 'ngx-bootstrap/modal';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  ReplaySubject,
  Subscription,
  throwError,
}                                              from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
}                                 from 'rxjs/operators';
import { AppState }               from '../../core/store';
import { GridTotalService }       from '../../shared/components/grid-total/grid-total.service';
import { GridContextMenuService } from '../../shared/grid-components/grid-context-menu.service';
import {
  ExportTypes,
  GridDataStoreModel,
  GridTypes,
}                                 from '../../shared/models/grid-data-store.model';
import { LastQuery }              from '../../shared/models/last-query';
import { LiveGridFilters }        from '../../shared/models/live-grid-filters';
import { MonacoEditorOptions }    from '../../shared/models/qql-editor';
import { SchemaTypeModel }        from '../../shared/models/schema.type.model';
import { HasRightPanel }            from '../../shared/right-pane/has-right-panel';
import { RightPaneService }         from '../../shared/right-pane/right-pane.service';
import { ExportService }            from '../../shared/services/export.service';
import { GridService }              from '../../shared/services/grid.service';
import { MonacoQqlConfigService }   from '../../shared/services/monaco-qql-config.service';
import { MonacoQqlTokensService }   from '../../shared/services/monaco-qql-tokens.service';
import { PermissionsService }       from '../../shared/services/permissions.service';
import { SchemaService }            from '../../shared/services/schema.service';
import { ShareLinkService }         from '../../shared/services/share-link.service';
import { StorageService }           from '../../shared/services/storage.service';
import { StreamModelsService }      from '../../shared/services/stream-models.service';
import { TabStorageService }        from '../../shared/services/tab-storage.service';
import { copyToClipboard }          from '../../shared/utils/copy';
import { GridStateModel }           from '../streams/models/grid.state.model';
import { StreamDetailsModel }       from '../streams/models/stream.details.model';
import { getActiveTab }             from '../streams/store/streams-tabs/streams-tabs.selectors';
import { CreateViewQueryComponent } from './create-view/create-view-query.component';
import { LastQueriesService }       from './services/last-queries.service';
import { QueryService }             from './services/query.service';
import * as NotificationsActions    from '../../core/modules/notifications/store/notifications.actions';

@Component({
  selector: 'app-query',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss'],
  providers: [
    GridService,
    MonacoQqlConfigService,
    MonacoQqlTokensService,
    TabStorageService,
    GridContextMenuService,
    RightPaneService,
    GridTotalService,
  ],
})
export class QueryComponent implements OnInit, AfterViewInit {
  
  @ViewChild('topSplitAreaContainer') topSplitAreaContainer: ElementRef<HTMLElement>;
  @ViewChild('sendQueryDropDown', {read: BsDropdownDirective}) sendQueryDropDown: BsDropdownDirective;
  @ViewChild('lastQueriesDropdown', {read: BsDropdownDirective}) lastQueriesDropdown: BsDropdownDirective;
  @ViewChild('exportDropdown', {read: BsDropdownDirective}) exportDropdown: BsDropdownDirective;
  
  form: UntypedFormGroup;
  loading$ = new BehaviorSubject(false);
  pending$ = new BehaviorSubject(false);
  exporting$ = new BehaviorSubject(false);
  gridOptions$: Observable<GridOptions>;
  gridState: GridStateModel;
  showGrid = false;
  sendBtnDisabled$: Observable<boolean>;
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
  rawSchema: { types: SchemaTypeModel[]; all: SchemaTypeModel[] };
  liveGridName$: Observable<string>;
  gridLiveFilters: LiveGridFilters;
  isLiveGrid: boolean;
  gridTypesArray = Object.values(GridTypes);
  exportTypesArray = Object.values(ExportTypes);
  shareUrl: string;
  shareUrlValid = false;
  isWriter$: Observable<boolean>;
  queryError = false;
  private serverErrorQueries = this.queryService.serverErrorQueries;
  
  private destroy$ = new ReplaySubject(1);
  private currentQuery: Subscription;
  private schema: SchemaTypeModel[];
  
  constructor(
    private fb: UntypedFormBuilder,
    private gridService: GridService,
    private queryService: QueryService,
    private storageService: StorageService,
    private activatedRoute: ActivatedRoute,
    private cdRef: ChangeDetectorRef,
    private tabStorageService: TabStorageService<GridDataStoreModel>,
    private monacoQqlConfigService: MonacoQqlConfigService,
    private schemaService: SchemaService,
    private translateService: TranslateService,
    private appStore: Store<AppState>,
    private streamModelsService: StreamModelsService,
    private lastQueriesService: LastQueriesService,
    private exportService: ExportService,
    private messageInfoService: RightPaneService,
    private router: Router,
    private httpClient: HttpClient,
    private bsModalService: BsModalService,
    private permissionsService: PermissionsService,
    private shareLinkService: ShareLinkService,
    private gridTotalService: GridTotalService,
  ) {}
  
  ngOnInit() {
    this.isWriter$ = this.permissionsService.isWriter();
    
    this.showDetails$ = this.tabStorageService
      .flow<HasRightPanel>('rightPanel')
      .getData(['selectedMessage'])
      .pipe(map((data) => !!data?.selectedMessage));
    
    this.gridType$
      .pipe(
        map((type) => [GridTypes.live, GridTypes.monitor].includes(type)),
        takeUntil(this.destroy$)
      )
      .subscribe(isLiveGrid => this.isLiveGrid = isLiveGrid);
    
    this.createForm();
    this.gridService
      .infinityScroll((start, end) => {
        return this.tabId().pipe(
          take(1),
          switchMap((tabId) =>
            this.queryService.query(this.storageService.getExecutedQuery(tabId), start, end - start),
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
        this.setQueryError();
      });
  
    this.tabStorageService.getData().pipe(take(1)).subscribe((storage) => {
      if (storage?.data?.[1]) {
        this.gridTotalService.loadedFromCache(storage.data[1].length);
      }
    });

    this.setQueryError();
    
    this.tabStorageService
      .getData(['data', 'error', 'hideColumnsByDefault', 'gridType', 'query'])
      .pipe(
        tap((model) => this.toggleGrid(!!model?.data)),
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
              qql: query?.replace(/\r/g, '\\r').replace(/\n/g, '\\n'),
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
    
    this.sendBtnDisabled$ = combineLatest([
      this.loading$,
      this.pending$,
    ]).pipe(
      map(([loading, pending]) => (loading && !pending)),
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
      .onColumns()
      .pipe(takeUntil(this.destroy$))
      .subscribe((columns) => {
        this.gridService.hideColumnsByDefault(columns.includes('*'));
      });
    
    this.monacoQqlConfigService
      .onCtrlEnter()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onSubmit());
  }
  
  ngAfterViewInit() {
    this.editorSize$ = this.tabStorageService.getData(['editorSize']).pipe(
      map((data) => {
        return data?.editorSize === undefined ? 50 : data?.editorSize;
      }),
    );
    this.gridSize$ = this.editorSize$.pipe(map((size) => 100 - size));
    
    const dropdowns = [this.sendQueryDropDown, this.lastQueriesDropdown, this.exportDropdown];
    dropdowns.forEach(dropdown => {
      dropdown.isOpenChange.pipe(takeUntil(this.destroy$), distinctUntilChanged()).subscribe(isOpen => {
        if (isOpen) {
          dropdowns.filter(d => d !== dropdown).forEach(d => d.hide());
        }
      });
    });
  }
  
  onDragEnd({sizes}: IOutputData) {
    this.tabStorageService
      .updateData((data) => ({...data, editorSize: sizes[0] as number}))
      .subscribe();
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
    this.pending$.next(true);
    this.cdRef.detectChanges();
    this.gridTotalService.startLoading();
    this.currentQuery = combineLatest([
      this.queryService.describe(formData.query),
      ![GridTypes.live, GridTypes.monitor].includes(this.gridType$.getValue())
        ? this.queryService.query(formData.query, 0, 100).pipe(tap((data) => this.gridTotalService.endLoading(data.length)))
        : of([]),
    ])
      .pipe(
        catchError((err) => {
          this.appStore.dispatch(
            new NotificationsActions.AddNotification({
              message: err.error.message,
              dismissible: true,
              closeInterval: 5000,
              type: 'danger',
              fullErrorText: JSON.stringify(err.error, null, ' ')
            }),
          );
          this.queryError = true;
          this.serverErrorQueries.add(this.form.get('query').value);
          return throwError(err);
        }),
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
        switchMap(() => this.gridService.onGridReady()),
        switchMap(gridReady => {
          if (!this.isLiveGrid) {
            gridReady.api.ensureIndexVisible(0);
          }
          return this.tabId().pipe(take(1));
        }),
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
        (control: UntypedFormControl) => (control.value?.trim()?.length > 0 ? null : {required: true}),
      ],
    });
    
    this.tabId()
      .pipe(takeUntil(this.destroy$), withLatestFrom(this.appStore.pipe(select(getActiveTab))))
      .subscribe(([tabId, tab]) => {
        const stored = this.storageService.getQueryFilter(tabId);
        let tabQuery = tab.queryStream ? `SELECT * FROM "${tab.queryStream}" ` : '';
        if (tab.querySymbol) {
          tabQuery += `WHERE symbol == '${tab.querySymbol}'`;
        }
        const formValue = stored || {query: tab.queryInitialQuery || tabQuery};
        this.updateShareUrl(formValue.query);
        this.form.patchValue(formValue, {emitEvent: false});
      });
    
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$), withLatestFrom(this.tabId()))
      .subscribe(([data, tabId]) => {
        this.storageService.setQueryFilter(tabId, data);
        this.updateShareUrl(data.query);
      });
  }
  
  share() {
    this.shareLinkService.copyUrlByString(this.shareUrl);
  }
  
  private updateShareUrl(query: string) {
    this.shareUrl = this.shareLinkService.getShareUrl({query: true, queryInitialQuery: query});
    this.shareUrlValid = !!query?.trim() && this.shareUrl.length <= 2000;
  }
  
  createView() {
    this.bsModalService.show(CreateViewQueryComponent, {initialState: {query: this.form.get('query').value}});
  }
  
  onValidUpdate() {
    this.cdRef.detectChanges();
  }

  setQueryError() {
    if (this.serverErrorQueries.has(this.form.get('query').value)) {
      this.queryError = true;
    }
  }
}
