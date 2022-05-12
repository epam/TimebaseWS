import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  ActivatedRoute,
  Data,
  Params,
}                                                                           from '@angular/router';
import { HdDate }                                                           from '@assets/hd-date/hd-date';
import {
  select,
  Store,
}                                                                           from '@ngrx/store';
import { AgGridModule }                                                     from 'ag-grid-angular';
import {
  CellClickedEvent,
  CellDoubleClickedEvent,
  Column,
  ColumnApi,
  ColumnMovedEvent,
  ColumnPinnedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridOptions,
  GridReadyEvent,
}                                                                           from 'ag-grid-community';
import {
  BsModalRef,
  BsModalService,
}                                                                           from 'ngx-bootstrap/modal';
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  timer,
}                                                                           from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
}                                                                           from 'rxjs/operators';
import { AppState }                                                         from '../../../../core/store';
import { GridContextMenuService }                                           from '../../../../shared/grid-components/grid-context-menu.service';
import {
  SchemaAllTypeModel,
  SchemaTypeModel,
}                                                                           from '../../../../shared/models/schema.type.model';
import { HasRightPanel }                                                    from '../../../../shared/right-pane/has-right-panel';
import { RightPaneService }                                                 from '../../../../shared/right-pane/right-pane.service';
import { GlobalFiltersService }                                             from '../../../../shared/services/global-filters.service';
import { GridEventsService }                                                from '../../../../shared/services/grid-events.service';
import { GridService }                                                      from '../../../../shared/services/grid.service';
import { PermissionsService }                                               from '../../../../shared/services/permissions.service';
import { SchemaService }                                                    from '../../../../shared/services/schema.service';
import { StreamModelsService }                                              from '../../../../shared/services/stream-models.service';
import { TabStorageService }                                                from '../../../../shared/services/tab-storage.service';
import {
  autosizeAllColumns,
  columnIsMoved,
  columnIsPinned,
  columnIsVisible,
  columnsVisibleColumn,
  defaultGridOptions,
  gridStateLSInit,
}                                                                           from '../../../../shared/utils/grid/config.defaults';
import { FilterModel }                                                      from '../../models/filter.model';
import { GridStateModel }                                                   from '../../models/grid.state.model';
import { StreamDetailsModel }                                               from '../../models/stream.details.model';
import { TabModel }                                                         from '../../models/tab.model';
import { StreamDataService }                                                from '../../services/stream-data.service';
import * as FilterActions                                                   from '../../store/filter/filter.actions';
import * as StreamDetailsActions
                                                                            from '../../store/stream-details/stream-details.actions';
import { StreamDetailsEffects }                                             from '../../store/stream-details/stream-details.effects';
import * as fromStreamDetails
                                                                            from '../../store/stream-details/stream-details.reducer';
import { getStreamOrSymbolByID }                                            from '../../store/stream-details/stream-details.selectors';
import * as fromStreams
                                                                            from '../../store/streams-list/streams.reducer';

import {
  getActiveOrFirstTab,
  getActiveTab,
  getActiveTabFilters,
  getTabs,
}                                    from '../../store/streams-tabs/streams-tabs.selectors';
import * as TimelineBarActions       from '../../store/timeline-bar/timeline-bar.actions';
import { ModalSendMessageComponent } from '../modals/modal-send-message/modal-send-message.component';

const now = new HdDate();

export const toUtc = (date: any) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(newDate.getMilliseconds() + now.getTimezoneOffset() * 60 * 1000);
  return newDate;
};

export const fromUtc = (date: any) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(newDate.getMilliseconds() - now.getTimezoneOffset() * 60 * 1000);
  return newDate;
};

@Component({
  selector: 'app-stream-view-reverse',
  templateUrl: './stream-view-reverse.component.html',
  styleUrls: ['./stream-view-reverse.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GridService, GridContextMenuService, StreamDataService],
})
export class StreamViewReverseComponent implements OnInit, OnDestroy {
  @ViewChild('streamDetailsGrid', {static: true}) agGrid: AgGridModule;

  bsModalRef: BsModalRef;
  streamName: string;
  tabName: string;
  streamDetails: Observable<fromStreamDetails.State>;
  activeTab: Observable<TabModel>;
  gridOptions: GridOptions;
  hideGrid$ = new BehaviorSubject(false);

  private tabFilter;
  private columnsIdVisible: {[index: string]: boolean} = {};
  private gridStateLS: GridStateModel = {visibleArray: [], pinnedArray: [], resizedArray: []};
  private rowData;
  private destroy$ = new ReplaySubject(1);
  private readyApi: GridOptions;
  private streamId: string;
  private gridDefaults: GridOptions = {
    ...defaultGridOptions,
    rowBuffer: 10,
    enableFilter: true,
    enableSorting: true,
    suppressRowClickSelection: false,
    rowSelection: 'multiple',
    defaultColDef: {
      filter: false,
      sortable: false,
      lockPinned: true,
      headerComponent: 'GridHeaderComponent',
    },
    enableRangeSelection: true,
    rowModelType: 'infinite',
    infiniteInitialRowCount: 1,
    maxConcurrentDatasourceRequests: 1,
    enableServerSideSorting: true,
    enableServerSideFilter: true,
    gridAutoHeight: false,
    stopEditingWhenGridLosesFocus: true,
    onCellDoubleClicked: (event: CellDoubleClickedEvent) => {
      this.messageInfoService.doubleClicked(event.data);
    },
    onCellClicked: (event: CellClickedEvent) => {
      this.messageInfoService.cellClicked(event);
    },
    onPinnedRowDataChanged: () => {
      this.messageInfoService.onPinnedRowDataChanged();
    },
    onGridReady: (readyEvent: GridReadyEvent) => this.gridIsReady(readyEvent),
    onColumnResized: (resizedEvent: ColumnResizedEvent) =>
      this.gridEventsService.columnIsResized(resizedEvent, this.tabName, this.gridStateLS),
    onColumnVisible: (visibleEvent: ColumnVisibleEvent) =>
      columnIsVisible(visibleEvent, this.tabName, this.gridStateLS),
    onColumnMoved: (movedEvent: ColumnMovedEvent) =>
      columnIsMoved(movedEvent, this.tabName, this.gridStateLS),
    onColumnPinned: (pinnedEvent: ColumnPinnedEvent) =>
      columnIsPinned(pinnedEvent, this.tabName, this.gridStateLS),
    onModelUpdated: (params) => {
      autosizeAllColumns(params.columnApi);
      if (this.gridStateLS.resizedArray.length) {
        for (const item of this.gridStateLS.resizedArray) {
          params.columnApi.setColumnWidth(item.colId, item.actualWidth, true);
        }
      }
    },
  };

  constructor(
    private appStore: Store<AppState>,
    private route: ActivatedRoute,
    private streamsStore: Store<fromStreams.FeatureState>,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
    private streamDetailsEffects: StreamDetailsEffects,
    private dataSource: StreamDataService,
    private modalService: BsModalService,
    private gridEventsService: GridEventsService,
    private globalFiltersService: GlobalFiltersService,
    private gridService: GridService,
    private gridContextMenuService: GridContextMenuService,
    private permissionsService: PermissionsService,
    private streamModelsService: StreamModelsService,
    private tabStorageService: TabStorageService<HasRightPanel>,
    private messageInfoService: RightPaneService,
    private schemaService: SchemaService,
  ) {}

  ngOnInit() {
    this.permissionsService
      .isWriter()
      .pipe(take(1))
      .subscribe((isWriter) => {
        if (!isWriter) {
          return;
        }

        this.gridContextMenuService.addCellMenuItems([
          {
            data: (event) => ({
              disabled: !event.node || !this.streamId,
              name: 'Send Message',
              action: () => {
                this.bsModalRef = this.modalService.show(ModalSendMessageComponent, {
                  initialState: {
                    stream: {
                      id: this.streamId,
                      name: this.streamName,
                    },
                    formData: (event.node.data as StreamDetailsModel)?.original, // (params.node.data as StreamDetailsModel).$type, //
                  },
                  ignoreBackdropClick: true,
                  class: 'modal-message scroll-content-modal',
                });
              },
            }),
            alias: 'sendMessage',
          },
        ]);
      });

    this.gridContextMenuService.addColumnMenuItems([
      {
        data: (event) => ({
          name: 'Autosize This Column',
          action: () => {
            event.columnApi.autoSizeColumn(event.column);
            const filtered = this.gridStateLS.resizedArray.filter(
              (item) => item.colId !== event.column.getColId(),
            );
            this.gridStateLS.resizedArray = [...filtered];
            localStorage.setItem('gridStateLS' + this.tabName, JSON.stringify(this.gridStateLS));
          },
        }),
        alias: 'autosize',
      },
      {
        data: (event) => ({
          name: 'Autosize All Columns',
          action: () => {
            autosizeAllColumns(event.columnApi);
            this.gridStateLS.resizedArray = [];
            localStorage.setItem('gridStateLS' + this.tabName, JSON.stringify(this.gridStateLS));
          },
        }),
        alias: 'autosizeAll',
      },
      {
        data: (event) => ({
          name: 'Reset Columns',
          action: () => {
            this.gridStateLS = {visibleArray: [], pinnedArray: [], resizedArray: []};
            localStorage.removeItem('gridStateLS' + this.tabName);
            if (this.rowData) {
              event.columnApi.resetColumnState();
              this.columnsIdVisible = {};
              this.columnsVisibleData(event.columnApi, this.rowData);
              timer(100).subscribe(() => autosizeAllColumns(event.columnApi));
            }
          },
        }),
        alias: 'reset',
      },
    ]);

    this.activeTab = this.appStore.pipe(select(getActiveOrFirstTab));

    this.globalFiltersService
      .getFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.readyApi?.api.redrawRows());

    this.appStore
      .pipe(
        select(getTabs),
        filter((tabs) => !!tabs),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe((tabs: TabModel[]) => {
        this.route.params
          .pipe(
            filter((params: {stream: string; id: string; symbol?: string}) => !!params.stream),
            withLatestFrom(this.route.data),
            withLatestFrom(this.route.queryParams),
            switchMap(
              ([[params, data], queryParams]: [
                [{stream: string; id: string; symbol?: string}, Data],
                Params,
              ]) =>
                this.appStore.pipe(
                  select(getStreamOrSymbolByID, {
                    streamID: params.stream,
                    symbol: params.symbol,
                    uid: params.id,
                    space: queryParams.space,
                  }),
                  filter((tabModel: TabModel) => !!tabModel),
                  take(1),
                  map((tabModel: TabModel) => {
                    return [tabModel, data, tabs];
                  }),
                ),
            ),
            takeUntil(this.destroy$),
          )
          .subscribe(([tabModel, data, tabs]: [TabModel, Data, TabModel[]]) => {
            this.streamDetailsStore.dispatch(
              new StreamDetailsActions.GetSymbols({
                streamId: tabModel.stream,
                ...(tabModel.space ? {spaceId: tabModel.space} : {}),
              }),
            );
            this.streamId = tabModel.stream;
            this.streamName = tabModel.name;
            if (!tabModel.stream) return;
            // Key is streamName for LocalStorage  Grid State
            this.tabName = tabModel.stream;
            if (tabModel.id) this.tabName += tabModel.id;
          });

        this.appStore
          .pipe(
            select(getActiveTabFilters),
            filter((filter) => !!filter),
            take(1),
            takeUntil(this.destroy$),
          )
          .subscribe((filter: FilterModel) => {
            this.appStore.dispatch(new TimelineBarActions.ClearLoadedDates());
            this.appStore.dispatch(
              new FilterActions.SetFilters({
                filter: {...filter} || {},
              }),
            );

            this.streamsStore.dispatch(new StreamDetailsActions.CleanStreamData());
          });
      });

    this.gridOptions = this.gridDefaults;
  }

  columnsVisibleData(columnApi: ColumnApi, data: any) {
    const cols: Column[] = columnApi.getAllColumns();
    // TODO: sometimes if > 1000 columns don't work getAllColumns() - is NULL , need another method
    if (cols && cols.length) {
      for (let i = 0; i < cols.length; i++) {
        const colIdArr = cols[i]['colId'].split('.');

        if (colIdArr.length === 2) {
          if (this.columnsIdVisible[cols[i]['colId']]) {
            return;
          }
          if (
            data.find((item) => {
              if (item.hasOwnProperty(colIdArr[0])) {
                return item[colIdArr[0]][colIdArr[1]];
              }
            })
          ) {
            columnApi.setColumnVisible(cols[i]['colId'], true);
            this.columnsIdVisible[cols[i]['colId']] = true;
          }
        }
      }
    }
    this.gridStateLS = gridStateLSInit(columnApi, this.tabName, this.gridStateLS);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.streamsStore.dispatch(new StreamDetailsActions.StopSubscriptions());
  }

  private gridIsReady(readyEvent: GridReadyEvent) {
    this.readyApi = {...readyEvent};

    this.gridService.setTooltipDelay(readyEvent);

    const tabToUnique = (tab) =>
      JSON.stringify({id: tab.id, filter: {...tab.filter, silent: null, manuallyChanged: null}});

    const getProps = (schema) => {
      return [
        columnsVisibleColumn(),
        {
          headerName: 'Symbol',
          field: 'symbol',
          tooltipField: 'symbol',
          pinned: 'left',
          filter: false,
          sortable: false,
          headerTooltip: 'Symbol',
        },
        {
          headerName: 'Timestamp',
          field: 'timestamp',
          pinned: 'left',
          filter: false,
          sortable: false,
          headerTooltip: 'Timestamp',
          cellRenderer: (params) => this.gridService.dateFormat(params),
          tooltipValueGetter: (params) => this.gridService.dateFormat(params),
        },
        {
          headerName: 'Type',
          field: '$type',
          tooltipField: '$type',
          pinned: 'left',
          filter: false,
          sortable: false,
          headerTooltip: 'Type',
          hide: true,
        },
        ...this.gridService.columnFromSchema(
          this.streamModelsService.getSchemaForColumns(schema.types, schema.all),
          true,
        ),
      ];
    };

    this.appStore
      .pipe(
        select(getActiveTab),
        filter(Boolean),
        distinctUntilChanged((prev, current) => tabToUnique(prev) === tabToUnique(current)),
        filter((tab: TabModel) => !!tab.filter.from),
      )
      .pipe(
        debounceTime(0),
        switchMap((activeTab: TabModel) => {
          this.hideGrid$.next(true);
          return this.schemaService.getSchema(activeTab.stream, null, true).pipe(
            map((schema) => [activeTab, schema]),
            take(1),
          );
        }),

        tap(
          ([activeTab, schema]: [
            TabModel,
            {types: SchemaTypeModel[]; all: SchemaAllTypeModel[]},
          ]) => {
            this.messageInfoService.tabChanged();
            this.tabFilter = {...activeTab.filter};
            this.columnsIdVisible = {};
            readyEvent.api.setDatasource(this.dataSource.withTab(activeTab, schema.all));
          },
        ),
        switchMap(([activeTab, schema]) =>
          this.dataSource.onLoadedData().pipe(
            take(1),
            map((data) => [getProps(schema), data]),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe(([props, data]) => {
        readyEvent.api.setColumnDefs(null);
        readyEvent.api.setColumnDefs(props);
        this.columnsIdVisible = {};
        this.columnsVisibleData(readyEvent.columnApi, data);
        timer().subscribe(() => this.hideGrid$.next(false));
      });

    this.columnsIdVisible = {};
    this.messageInfoService.setGridApi(this.readyApi);
  }
}
