import { Component, Input, OnDestroy, OnInit }                                from '@angular/core';
import { select, Store }                                                      from '@ngrx/store';
import { GridOptions, GridReadyEvent }                                        from 'ag-grid-community';
import equal                                                                  from 'fast-deep-equal';
import { Observable, of, Subject }                                            from 'rxjs';
import { distinctUntilChanged, filter, map, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { AppState }                                                           from '../../../../core/store';
import {
  autosizeAllColumns,
  defaultGridOptions,
}                                                                             from '../../../../shared/utils/grid/config.defaults';
import { ConnectionDetailsModel }                                             from '../../models/details.model';
import { WSRResponseMetadataModel }                                           from '../../models/metadata.model';
import { COLOR_TRAFFIC }                                                      from '../../models/traffic.node.model';
import { FlowDataService }                                                    from '../../services/flow-data.service';
import { getActiveNode }                                                      from '../../store/flow.selectors';

@Component({
  selector: 'app-connection-details',
  templateUrl: './connection-details.component.html',
  styleUrls: ['./connection-details.component.scss'],
})
export class ConnectionDetailsComponent implements OnInit, OnDestroy {
  @Input() isParent = false;
  @Input() nodeConnection: ConnectionDetailsModel;
  public showContent = true;
  public selectedConnectionView$: Observable<ConnectionDetailsModel>;
  public metadata$: Observable<WSRResponseMetadataModel | null>;
  public gridCursorsOptions;
  public gridLoadersOptions;
  public colors = COLOR_TRAFFIC;
  private cursorsLoadersLength = {
    loaders: 0,
    cursors: 0,
  };
  private gridDefaults: GridOptions = {
    ...defaultGridOptions,
    rowBuffer: 10,
    enableCellChangeFlash: true,
    suppressCellSelection: true,
    suppressRowClickSelection: false,
    suppressScrollOnNewData: true,
    rowSelection: 'multiple',
    defaultColDef: {
      filter: true,
      sortable: true,
      // lockPinned: true,
      headerComponent: 'GridHeaderComponent',
    },
    gridAutoHeight: false,
    getRowNodeId: ({id}) => id,
    onGridReady: (readyEvent: GridReadyEvent) => this.gridIsReady(readyEvent),
    onModelUpdated: (params) => {
      autosizeAllColumns(params.columnApi);
    },
  };
  private readyApi: GridOptions;
  private destroy$ = new Subject<any>();

  constructor(private appStore: Store<AppState>, private flowDataService: FlowDataService) {}

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    if (this.isParent) {
      this.flowDataService.stopMetadataSubscription();
    }
  }

  ngOnInit(): void {
    if (this.nodeConnection) {
      this.selectedConnectionView$ = of(this.nodeConnection);
    } else {
      this.selectedConnectionView$ = this.appStore.pipe(
        select(getActiveNode),
        filter((node) => node?.type === 'connection'),
      ) as Observable<ConnectionDetailsModel>;
    }
    if (this.isParent) {
      this.selectedConnectionView$
        .pipe(filter(Boolean), take(1), takeUntil(this.destroy$))
        .subscribe((connection: ConnectionDetailsModel) => {
          this.flowDataService.startMetadataSubscription({
            connections: JSON.stringify([
              {
                source: connection.source.name,
                target: connection.target.name,
              },
            ]),
          });
        });
    }
    this.metadata$ = this.flowDataService.getMetadata$().pipe(
      withLatestFrom(this.selectedConnectionView$.pipe(filter(Boolean))),
      map(([metadataResp, connection]: [WSRResponseMetadataModel[], ConnectionDetailsModel]) => {
        return (
          metadataResp.find(
            (metadata) =>
              metadata.source === connection.source.name &&
              metadata.target === connection.target.name,
          ) || null
        );
      }),
    );

    this.gridLoadersOptions = {
      ...this.gridDefaults,
      onGridReady: (readyEvent: GridReadyEvent) => {
        this.gridIsReady(readyEvent, 'loader');
        this.metadata$
          .pipe(
            map((wsMetadataResp) => wsMetadataResp?.loaders || null),
            distinctUntilChanged(equal),
            takeUntil(this.destroy$),
          )
          .subscribe((loaders) => {
            this.cursorsLoadersLength = {
              ...this.cursorsLoadersLength,
              loaders: loaders?.length || 0,
            };
            readyEvent.api.setRowData(loaders || []);
          });
      },
    };
    this.gridCursorsOptions = {
      ...this.gridDefaults,
      onGridReady: (readyEvent: GridReadyEvent) => {
        this.gridIsReady(readyEvent, 'cursor');
        this.metadata$
          .pipe(
            map((wsMetadataResp) => wsMetadataResp?.cursors || null),
            distinctUntilChanged(equal),
            takeUntil(this.destroy$),
          )
          .subscribe((cursors) => {
            this.cursorsLoadersLength = {
              ...this.cursorsLoadersLength,
              cursors: cursors?.length || 0,
            };
            readyEvent.api.setRowData(cursors || []);
          });
      },
    };
  }

  public getMetadataLength(node: ConnectionDetailsModel, metadataKey: 'loaders' | 'cursors') {
    return this.cursorsLoadersLength?.[metadataKey] || 0;
  }

  private gridIsReady(readyEvent: GridReadyEvent, dataType?: 'loader' | 'cursor') {
    this.readyApi = {...readyEvent};
    readyEvent.api.setColumnDefs([
      {
        headerName: 'ID',
        field: 'id',
      },
      {
        headerName: 'RPS',
        field: 'rps',
        ...(dataType
          ? {
              cellStyle: {color: this.colors[dataType]},
            }
          : {}),
      },
    ]);
  }
}
