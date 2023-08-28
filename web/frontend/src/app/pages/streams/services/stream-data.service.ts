import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable }                    from '@angular/core';
import { Store }                         from '@ngrx/store';
import { IDatasource }                   from 'ag-grid-community';
import { IGetRowsParams }                from 'ag-grid-community/src/ts/rowModels/iDatasource';
import { Observable, ReplaySubject }     from 'rxjs';
import { filter, skip, takeUntil }       from 'rxjs/operators';
import { AppState }                      from '../../../core/store';
import { GridTotalService }              from '../../../shared/components/grid-total/grid-total.service';
import { SchemaTypeModel }               from '../../../shared/models/schema.type.model';
import { RightPaneService }              from '../../../shared/right-pane/right-pane.service';
import { StreamModelsService }           from '../../../shared/services/stream-models.service';
import { StreamDetailsModel }            from '../models/stream.details.model';
import { TabModel }                      from '../models/tab.model';
import * as StreamDetailsActions         from '../store/stream-details/stream-details.actions';
import * as fromStreams                  from '../store/streams-list/streams.reducer';
import * as TimelineBarActions           from '../store/timeline-bar/timeline-bar.actions';

@Injectable()
export class StreamDataService implements IDatasource {
  private activeTab: TabModel;
  private schema: SchemaTypeModel[];
  private lastRow = 0;
  private loadedData$ = new ReplaySubject<StreamDetailsModel[]>(1);
  public getRowsParams: IGetRowsParams;

  constructor(
    private httpClient: HttpClient,
    private streamsStore: Store<fromStreams.FeatureState>,
    private appStore: Store<AppState>,
    private streamModelsService: StreamModelsService,
    private messageInfoService: RightPaneService,
    private gridTotalService: GridTotalService,
  ) {}

  withTab(activeTab: TabModel, schema: SchemaTypeModel[]) {
    this.activeTab = activeTab;
    this.schema = schema;
    this.loadedData$.next(null);
    return this;
  }

  onLoadedData(): Observable<StreamDetailsModel[]> {
    return this.loadedData$.pipe(filter((data) => !!data));
  }

  destroy() {
    this.lastRow = 0;
  }

  public getRows(params: IGetRowsParams): void {
    this.getRowsParams = params;
    this.gridTotalService.startLoading();
    const request = params;
    const activeTab = this.activeTab;
    let urlParams = {},
      url;
    const filter = activeTab?.filter || {};
    if (activeTab?.symbol) {
      url = `${encodeURIComponent(activeTab.stream)}/${encodeURIComponent(activeTab.symbol)}`;
    } else {
      url = `${encodeURIComponent(activeTab?.stream)}`;
    }
    url += '/select';
    urlParams = {
      ...urlParams,
      offset: request?.startRow + '',
      rows: request?.endRow - request?.startRow + '',
    };
    Object.keys(filter).forEach((key) => {
      if (
        ![
          null,
          'filter_symbols',
          'filter_types',
          'filter_date_format',
          'filter_time_format',
          'manuallyChanged',
        ].includes(key)
      ) {
        urlParams[key] = filter[key];
      } else if (key === 'filter_symbols') {
        urlParams['symbols'] = filter[key];
      } else if (key === 'filter_types') {
        urlParams['types'] = filter[key];
      }
    });
    if (activeTab.reverse) {
      urlParams['reverse'] = activeTab.reverse;
      if (!urlParams['from']) {
        urlParams['from'] = new Date().toISOString();
      }
    } else if (activeTab.filter && activeTab.filter.from == null) {
      delete urlParams['from'];
    }

    if (typeof activeTab.space === 'string') {
      urlParams['space'] = encodeURIComponent(activeTab.space);
    }

    this.appStore.dispatch(new TimelineBarActions.ClearLoadedDates());

    if (filter && filter['from']) {
      if (activeTab.reverse) {
        this.appStore.dispatch(
          new TimelineBarActions.SetLastLoadedDate({
            date: filter['from'],
          }),
        );
      } else {
        this.appStore.dispatch(
          new TimelineBarActions.SetFirstLoadedDate({
            date: filter['from'],
          }),
        );
      }
    }

    this.httpClient
      .post<StreamDetailsModel[]>(url, urlParams, {
        headers: {
          customError: 'true',
        },
        params: {
          ...(typeof activeTab.space === 'string'
            ? {
                space: encodeURIComponent(activeTab.space),
              }
            : {}),
        },
      })
      .pipe(takeUntil(this.loadedData$.pipe(skip(1))))
      .subscribe(
        (resp: StreamDetailsModel[]) => {
          this.appStore.dispatch(new StreamDetailsActions.RemoveErrorMessage());
          if (resp) {
            const data = this.streamModelsService.getStreamModels(resp, this.schema);
            this.gridTotalService.endLoading(data.length);
            this.appStore.dispatch(new StreamDetailsActions.SetStreamData({streamData: data}));
            if (resp.length) {
              this.appStore.dispatch(new TimelineBarActions.ClearLoadedDates());
              if (activeTab.reverse) {
                this.appStore.dispatch(
                  new TimelineBarActions.SetFirstLoadedDate({
                    date: resp[resp.length - 1].timestamp,
                  }),
                );
              } else {
                this.appStore.dispatch(
                  new TimelineBarActions.SetLastLoadedDate({
                    date: resp[resp.length - 1].timestamp,
                  }),
                );
              }
              this.lastRow = request.startRow + data.length;
              this.loadedData$.next(data);
              params.successCallback(
                data,
                data.length < request.endRow - request.startRow
                  ? request.startRow + data.length
                  : -1,
              );
              this.messageInfoService.checkSelected();
            } else {
              this.loadedData$.next([]);
              params.successCallback([], this.lastRow);
            }
          } else {
            this.loadedData$.next(null);
            params.failCallback();
          }
        },
        (error: HttpErrorResponse) => {
          this.appStore.dispatch(
            new StreamDetailsActions.AddErrorMessage({
              message: error.error?.message || `No streams [${activeTab.stream}] found`,
            }),
          );
          this.loadedData$.next(null);
          params.successCallback([], this.lastRow);
        },
      );
  }
}
