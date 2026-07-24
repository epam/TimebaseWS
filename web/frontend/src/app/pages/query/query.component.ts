import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
}                                              from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute }              from '@angular/router';
import { select, Store }                       from '@ngrx/store';
import { TranslateService }                    from '@ngx-translate/core';
import { GridOptions }                         from 'ag-grid-community';
import { IOutputData }                         from 'angular-split/lib/interface';
import { BsDropdownDirective }                 from 'ngx-bootstrap/dropdown';
import { BsModalService }                      from 'ngx-bootstrap/modal';
import {
  BehaviorSubject,
  combineLatest,
  fromEvent,
  Observable,
  of,
  ReplaySubject,
  Subscription,
  throwError,
}                                              from 'rxjs';
import {
  catchError,
  delay,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  skip,
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
import { ShareLinkService }         from '../../shared/services/share-link.service';
import { StorageService }           from '../../shared/services/storage.service';
import { StreamModelsService }      from '../../shared/services/stream-models.service';
import { TabStorageService }        from '../../shared/services/tab-storage.service';
import { GridStateModel }           from '../streams/models/grid.state.model';
import { StreamDetailsModel }       from '../streams/models/stream.details.model';
import { getActiveTab }             from '../streams/store/streams-tabs/streams-tabs.selectors';
import { getTimebases }            from '../streams/store/timebases/timebases.selectors';
import { TimebaseInstanceDef }     from '../../shared/models/timebase-instance-def.model';
import { CreateViewQueryComponent } from './create-view/create-view-query.component';
import { LastQueriesService }       from './services/last-queries.service';
import { QueryService }             from './services/query.service';
import * as NotificationsActions    from '../../core/modules/notifications/store/notifications.actions';
import { getAppInfo } from 'src/app/core/store/app/app.selectors';
import { GenerateQueryService } from '../generate-ddl/generate-ddl.service';
import IRange = monaco.IRange;
import { QqlEditorComponent } from 'src/app/shared/qql-editor/qql-editor.component';

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
  @ViewChild('qqlEditor') qqlEditor: QqlEditorComponent;
  
  form: UntypedFormGroup;
  queryControl: AbstractControl;
  loading$ = new BehaviorSubject(false);
  pending$ = new BehaviorSubject(false);
  exporting$ = new BehaviorSubject(false);
  gridOptions$: Observable<GridOptions>;
  gridState: GridStateModel;
  showGrid = false;
  sendBtnDisabled$: Observable<boolean>;
  sendBtnText$: Observable<string>;
  sendButtonTooltip$: Observable<string>;
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
  requestError: { [key: string]: boolean } = {};
  editorIsReady$ = new BehaviorSubject(false);
  editor;
  selectedRange: { [key: string]: IRange } = {};
  currentTabId: string;
  tbId: string;
  tbUrl: string;
  timebases$: Observable<TimebaseInstanceDef[]>;
  selectedTbId: string;
  private timebasesList: TimebaseInstanceDef[] = [];
  private serverErrorQueries = this.queryService.serverErrorQueries;
  private validationErrors: { [key: string]: IRange } = {};
  
  private destroy$ = new ReplaySubject(1);
  private currentQuery: Subscription;
  private schema: SchemaTypeModel[];
  private freshResult: boolean;
  selectionValue$ = new BehaviorSubject({});
  selectedText = false;
  lastSubmittedQuery = {};
  selectedQuery = {};
  queryError: { [tabId: string]: boolean } = {};
  errorInsideSelectedText: boolean;

  constructor(
    private fb: UntypedFormBuilder,
    private gridService: GridService,
    private queryService: QueryService,
    private storageService: StorageService,
    private activatedRoute: ActivatedRoute,
    private cdRef: ChangeDetectorRef,
    private tabStorageService: TabStorageService<GridDataStoreModel>,
    private monacoQqlConfigService: MonacoQqlConfigService,
    private translateService: TranslateService,
    private appStore: Store<AppState>,
    private streamModelsService: StreamModelsService,
    private lastQueriesService: LastQueriesService,
    private exportService: ExportService,
    private messageInfoService: RightPaneService,
    private bsModalService: BsModalService,
    private permissionsService: PermissionsService,
    private shareLinkService: ShareLinkService,
    private gridTotalService: GridTotalService,
    private generateQueryService: GenerateQueryService,
    private elementRef: ElementRef
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

    this.tabId()
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => this.currentTabId = id);

    this.timebases$ = this.appStore.pipe(select(getTimebases));

    combineLatest([this.appStore.pipe(select(getActiveTab)), this.timebases$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([tab, timebases]) => {
        this.timebasesList = timebases || [];
        const storeTbId = tab?.tbId ?? this.timebasesList[0]?.id ?? null;
        this.tbId = this.selectedTbId ?? storeTbId;
        this.tbUrl = this.timebasesList.find((tb) => tb.id === this.tbId)?.url || null;
      });

    this.gridService
      .infinityScroll((start, end) => {
        return this.tabId().pipe(
          take(1),
          switchMap((tabId) =>
            this.queryService.query(this.storageService.getExecutedQuery(tabId), start, end - start, this.tbId),
          ),
          map((data) => this.mapResponseData(data)),
        );
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();

      if (this.generateQueryService.currentQuery) {
        this.form.patchValue({ query: this.generateQueryService.currentQuery });
        this.form.markAsPristine();
        this.generateQueryService.currentQuery = null;
      }
    
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
  
    this.tabStorageService.getData()
      .pipe(
        filter(storage => !!storage?.data?.[1] && !this.freshResult),
        take(1),
        tap(() => this.gridTotalService.startLoading())
      )
      .subscribe((storage) => this.gridTotalService.loadedFromCache(storage.data[1].length));

    this.setQueryError();
    
    this.tabStorageService
      .getData(['data', 'error', 'hideColumnsByDefault', 'gridType', 'query'])
      .pipe(
        tap((model) => this.toggleGrid(!!model?.data)),
        filter((model) => !!model?.data),
        takeUntil(this.destroy$),
      )
      .subscribe(({data: [schema, data, rawSchema], query, hideColumnsByDefault, gridType}) => {
        const editorValue = this.form.get('query').value;

        if (this.editor) {
          this.updateSelectedText(query, editorValue);
        } else {
          this.editorIsReady$.pipe(filter(Boolean)).subscribe(() => this.updateSelectedText(query, editorValue));
        }
        
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
              tbId: this.tbId,
            };
            this.toggleGrid(true);
            return;
          case GridTypes.view:
            this.schema = schema;
            this.gridService.hideColumnsByDefault(hideColumnsByDefault);
            this.setGridData(schema, data);
            this.lastSubmittedQuery[this.currentTabId] = query.trim();
            this.selectedQuery[this.currentTabId] = query.trim();
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
      switchMap(([pending, gridType]) => this.translateService
        .get(`qqlEditor.buttons.${pending ? 'cancel' : gridType}`))
      );

    this.sendButtonTooltip$ = combineLatest([this.sendBtnText$, this.pending$, this.selectionValue$]).pipe(
      map(([btnText, pending, selected]) => btnText + (!pending && selected[this.currentTabId] ? ' (SELECTED TEXT)' : ''))
    )
    
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
      .pipe(delay(500), takeUntil(this.destroy$))
      .subscribe(() => this.onSubmit());

    fromEvent(window, 'beforeunload').subscribe(() => {
      this.updateStorage();
    })

    this.form.get('query').valueChanges
      .pipe(skip(1), filter(() => this.lastSubmittedQuery[this.currentTabId]))
      .subscribe(value => this.updateSelectedText(this.lastSubmittedQuery[this.currentTabId], value));
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

  copyQueryText(query: string) {
    navigator.clipboard.writeText(query);
  }

  private updateStorage(newId: string = '') {
    const query = this.editor.getModel().getValueInRange(this.selectedRange[this.currentTabId]).trim() || 
      this.form?.get('query').value.trim();

    if (this.lastSubmittedQuery[this.currentTabId] !== query) {
      this.tabStorageService.updateData((storageData) => ({
        ...storageData,
        hideColumnsByDefault: this.gridService.columnsHiddenByDefault,
        data: [
          [],
          [],
          { types: [], all: [] },
        ],
        gridType: this.gridType$.getValue(),
        query: this.form.get('query').value,
        error: null,
      })).subscribe();
    }
  }
  
  onDragEnd({sizes}: IOutputData) {
    this.tabStorageService
      .updateData((data) => ({...data, editorSize: sizes[0] as number}))
      .subscribe();
  }

  setEditor(editor) {
    this.editor = editor;
    this.editor.onDidChangeCursorSelection((e) => {
      const selectionRange = {
        endColumn: e.selection.endColumn,
        endLineNumber: e.selection.endLineNumber,
        startColumn: e.selection.startColumn,
        startLineNumber: e.selection.startLineNumber
      };
      const selected = editor.getModel().getValueInRange(selectionRange);
      const currentSelectedTextValue = this.selectionValue$.getValue();
      this.selectionValue$.next({
        ...currentSelectedTextValue,
        [this.currentTabId]: selected
      });
      this.selectedText = !!selected;
    });
  }
  
  onSubmit(gridType: GridTypes = null) {
    if (gridType) {
      this.gridType$.next(gridType);
    }
    
    if (this.pending$.getValue()) {
      this.currentQuery.unsubscribe();
      return;
    }

    if (!this.form.get('query').value) {
      return;
    }
    
    const query = this.editor.getModel().getValueInRange(this.editor.getSelection()) || 
      this.form.get('query').value;

    this.selectedRange[this.currentTabId] = this.editor.getSelection();
    
    this.loading$.next(true);
    this.cdRef.detectChanges();
    const formData = { query };
    this.messageInfoService.clearSelectedMessage();
    this.pending$.next(true);
    this.cdRef.detectChanges();
    this.gridTotalService.startLoading();
    this.currentQuery = this.qqlEditor.validateQueryText(query, this.selectedRange[this.currentTabId]).pipe(
      switchMap(() => combineLatest([
        this.queryService.describe(formData.query, this.tbId),
        ![GridTypes.live, GridTypes.monitor].includes(this.gridType$.getValue())
          ? this.queryService.query(formData.query, 0, 100, this.tbId).pipe(tap((data) => this.gridTotalService.endLoading(data.length)))
          : of([]),
        ])),
        catchError((err) => {
          this.toggleGrid(false);
          this.requestError[this.currentTabId] = true;
          this.appStore.dispatch(
            new NotificationsActions.AddNotification({
              message: err.error.message,
              dismissible: true,
              closeInterval: 5000,
              type: 'danger',
              fullErrorText: JSON.stringify(err.error, null, ' ')
            }),
          );
          this.queryError[this.currentTabId] = true;
          this.serverErrorQueries.add(query);
          return throwError(err);
        }),
        finalize(() => {
          this.freshResult = true;
          setTimeout(() => this.freshResult = false, 1000);
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
            query,
            error: null,
          })),
        ),
        switchMap(() => this.gridService.onGridReady()),
        switchMap(gridReady => {
          this.toggleGrid(true);
          this.lastSubmittedQuery[this.currentTabId] = query;
          this.selectedQuery[this.currentTabId] = query;
          this.updateSelectedText(query, this.form.get('query').value);
          this.removeRequestError();
          if (!this.isLiveGrid) {
            gridReady.api.ensureIndexVisible(0);
          }
          return this.tabId().pipe(take(1));
        }),
      )
      .subscribe((tabId) => {
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
    this.editor.focus();
  }

  setError(errorLocation: IRange) {
    this.validationErrors[this.currentTabId] = errorLocation;
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
          this.queryService.export(this.form.get('query').value, this.exportType$.getValue(), this.tbId),
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

    this.queryControl = this.form.get('query');
    
    this.tabId()
      .pipe(
        takeUntil(this.destroy$), 
        withLatestFrom(this.appStore.pipe(select(getActiveTab)), this.appStore.pipe(select(getAppInfo))))
      .subscribe(([tabId, tab, appInfo]) => {
        const stored = this.storageService.getQueryFilter(tabId);
        const timebaseVersion = parseFloat(appInfo.timebases?.[0]?.serverVersion);
        let tabQuery = tab.queryStream ? `SELECT * FROM "${tab.queryStream}" ` : '';
        if (tab.querySymbol) {
          tabQuery += `WHERE symbol ${!timebaseVersion || timebaseVersion > 5.4 ? '==' : '='} '${tab.querySymbol}'`;
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
    const query = this.editor.getModel().getValueInRange(this.editor.getSelection()) ||
      this.form.get('query').value;
    this.bsModalService.show(CreateViewQueryComponent, {initialState: { query, tbId: this.tbId }});
  }

  onTbChange(tbId: string) {
    this.selectedTbId = tbId;
    this.tbId = tbId;
    this.tbUrl = this.timebasesList.find((tb) => tb.id === tbId)?.url || null;
  }
  
  onValidUpdate() {
    this.cdRef.detectChanges();
  }

  private setQueryError() {
    if (this.serverErrorQueries.has(this.form.get('query').value)) {
      this.queryError[this.currentTabId] = true;
    }
  }

  setEditorAsReady() {
    this.editorIsReady$.next(true);
  }

  removeRequestError() {
    this.requestError[this.currentTabId] = false;
  }

  updateSelectedText(query: string, fullText: string) {
    const selectedRangeText = this.selectedRange[this.currentTabId] ? 
      this.editor.getModel().getValueInRange(this.selectedRange[this.currentTabId]) : '';
    const errorRange = this.validationErrors[this.currentTabId];

    if (selectedRangeText.trim() === query.trim()) {
      this.errorInsideSelectedText = this.isErrorInsideSelectedText(this.selectedRange[this.currentTabId], errorRange);
      this.monacoQqlConfigService.setSelectedText(this.selectedRange[this.currentTabId], errorRange, this.errorInsideSelectedText);
    } else {
      const empty = {
        startLineNumber: 0,
        startColumn: 0,
        endLineNumber: 0,
        endColumn: 0,
      };
      this.selectedRange[this.currentTabId] = empty;
      const cursorPosition = this.editor?.getPosition();

      this.editor.setSelection(new monaco.Selection(
        cursorPosition.lineNumber, 
        cursorPosition.column, 
        cursorPosition.lineNumber, 
        cursorPosition.column));
          
      this.lastSubmittedQuery[this.currentTabId] = null;
      this.selectedQuery[this.currentTabId] = null;
      this.errorInsideSelectedText = this.isErrorInsideSelectedText(this.selectedRange[this.currentTabId], errorRange);
      this.monacoQqlConfigService.setSelectedText(empty, errorRange, this.errorInsideSelectedText);

      // const match = fullText.includes(query);

      // const queryLines = query.split(/\r?\n/);
      // const queryInLine = query.replace(/(\r\n|\n|\r)/gm, '').trim();
      // const model = this.editor.getModel();
  
      // const tempRanges = [];
      // for (let line of queryLines) {
      //   const matches = model?.findMatches(line, true, false, true, null, true);
  
      //   const filteredMatches = [];
      //   const fragments = new Set<string>();
      //   matches.forEach(m => {
      //     if (!fragments.has(m.matches[0])) {
      //       filteredMatches.push(m);
      //       fragments.add(m.matches[0]);
      //     }
      //   })
      //   if (filteredMatches?.length) {
      //     tempRanges.push(filteredMatches);
      //   }
      // }
  
      // const ranges = [];
      // if (tempRanges.length) {
      //   const startOptions = tempRanges[0];
      //   const endOptions = tempRanges[tempRanges.length - 1];
        
      //   for (let startOption of startOptions) {
      //     for (let endOption of endOptions) {
      //       const range = {
      //         endColumn: endOption.range.endColumn,
      //         endLineNumber: endOption.range.endLineNumber,
      //         startColumn: startOption.range.startColumn,
      //         startLineNumber: startOption.range.startLineNumber,
      //       };
      //       const textInRange = model.getValueInRange(range).replace(/(\r\n|\n|\r)/gm, '').trim();
      //       if (queryInLine === textInRange) {
      //         ranges.push(startOption.range, endOption.range);
      //       }
      //     }
      //   }
      // }
  
      // if (match && this.showGrid && ranges.length) {
      //   const fullRange = {
      //     startLineNumber: ranges[0].startLineNumber,
      //     startColumn: ranges[0].startColumn,
      //     endLineNumber: ranges[ranges.length - 1].endLineNumber,
      //     endColumn: ranges[ranges.length - 1].endColumn,
      //   };

      //   this.selectedRange[this.currentTabId] = fullRange;
      //   this.monacoQqlConfigService.setSelectedText(this.selectedRange[this.currentTabId], errorRange);
      // } else {
      //   const empty = {
      //     startLineNumber: 0,
      //     startColumn: 0,
      //     endLineNumber: 0,
      //     endColumn: 0,
      //   };
      //   this.selectedRange[this.currentTabId] = empty;
      //   const cursorPosition = this.editor?.getPosition();

      //   this.editor.setSelection(new monaco.Selection(
      //     cursorPosition.lineNumber, 
      //     cursorPosition.column, 
      //     cursorPosition.lineNumber, 
      //     cursorPosition.column));
          
      //   this.lastSubmittedQuery[this.currentTabId] = null;
      //   this.selectedQuery[this.currentTabId] = null;
      //   this.monacoQqlConfigService.setSelectedText(empty, errorRange);
      // }
      // this.cdRef.detectChanges();
    }
  }

  private isErrorInsideSelectedText(selectedTextRange: IRange, errorRange: IRange) {
    if (!selectedTextRange || !errorRange) {
      return false;
    }
    const emptyRange = selectedTextRange.startLineNumber === selectedTextRange.endLineNumber && 
      selectedTextRange.startColumn === selectedTextRange.endColumn;
    if (emptyRange) {
      return false;
    }
    return errorRange.startLineNumber >= selectedTextRange.startLineNumber 
      && errorRange.endLineNumber <= selectedTextRange.endLineNumber 
      && errorRange.startColumn >= selectedTextRange.startColumn 
      && errorRange.endColumn <= selectedTextRange.endColumn;
  }

  toggleQueryError(error: boolean) {
    this.queryError[this.currentTabId] = error;
  }
}
