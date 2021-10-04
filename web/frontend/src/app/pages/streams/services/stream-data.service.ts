import { HttpClient, HttpErrorResponse }                                                 from '@angular/common/http';
import { Injectable }                                                                    from '@angular/core';
import { select, Store }                                                from '@ngrx/store';
import { IDatasource, IServerSideDatasource, IServerSideGetRowsParams } from 'ag-grid-community';
import { IGetRowsParams }                                               from 'ag-grid-community/src/ts/rowModels/iDatasource';
import { combineLatest, Observable, Subject }                                            from 'rxjs';
import { distinctUntilChanged, filter, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { AppState }                                                                      from '../../../core/store';
import { StreamDetailsModel }                                                            from '../models/stream.details.model';
import { TabModel }                                                                      from '../models/tab.model';
import * as StreamDetailsActions                                                         from '../store/stream-details/stream-details.actions';
import { State as DetailsState }                                                         from '../store/stream-details/stream-details.reducer';
import { streamsDetailsStateSelector }                                                   from '../store/stream-details/stream-details.selectors';
import * as fromStreams                                                                  from '../store/streams-list/streams.reducer';
import { getActiveOrFirstTab, getActiveTab }                                             from '../store/streams-tabs/streams-tabs.selectors';
import * as TimelineBarActions from '../store/timeline-bar/timeline-bar.actions';

@Injectable()
export class StreamDataService implements IDatasource {
  private activeTab: TabModel;
  private destroy$ = new Subject();
  private lastRow = 0;

  constructor(
    private httpClient: HttpClient,
    private streamsStore: Store<fromStreams.FeatureState>,
    private appStore: Store<AppState>,
  ) {
  }

  withTab(activeTab: TabModel) {
    this.activeTab = activeTab;
    return this;
  }

  public getRows(params: IGetRowsParams): void {
    const request = params;
    const activeTab = this.activeTab;
    let urlParams = {},
      url;
    const filter = activeTab.filter || {};
    if (activeTab.symbol) {
      url = `${encodeURIComponent(activeTab.stream)}/${encodeURIComponent(activeTab.symbol)}`;
    } else {
      url = `${encodeURIComponent(activeTab.stream)}`;
    }
    url += '/select';
    urlParams = {
      ...urlParams,
      'offset': request.startRow + '',
      'rows': (request.endRow - request.startRow) + '',
    };
    Object.keys(filter).forEach(key => {
      if (key != null &&
        key !== 'filter_symbols'
        && key !== 'filter_types'
        // && filter[key] !== 'tabName'
        && key !== 'filter_date_format'
        && key !== 'filter_time_format') {
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
        this.appStore.dispatch(new TimelineBarActions.SetLastLoadedDate({
          date: filter['from'],
        }));
      } else {
        this.appStore.dispatch(new TimelineBarActions.SetFirstLoadedDate({
          date: filter['from'],
        }));
      }
    }

    this.httpClient
      .post<StreamDetailsModel[]>(url, urlParams, {
        headers: {
          'customError': 'true',
        },
        params: {
          ...(typeof activeTab.space === 'string' ? {
            space: encodeURIComponent(activeTab.space),
          } : {}),
        },
      })
      .subscribe((resp: StreamDetailsModel[]) => {
        this.appStore.dispatch(new StreamDetailsActions.SetStreamData({ streamData: resp.map(streamDetails => new StreamDetailsModel(streamDetails)) }));
        this.appStore.dispatch(new StreamDetailsActions.RemoveErrorMessage());
        if (resp) {
          if (resp.length) {
            this.appStore.dispatch(new StreamDetailsActions.SetStreamData({streamData: resp.map(streamDetails => new StreamDetailsModel(streamDetails))}));
            this.appStore.dispatch(new TimelineBarActions.ClearLoadedDates());

            const data = resp.map(streamDetails => new StreamDetailsModel(streamDetails));
            if (activeTab.reverse) {
              this.appStore.dispatch(new TimelineBarActions.SetFirstLoadedDate({
                date: resp[resp.length - 1].timestamp,
              }));
            } else {
              this.appStore.dispatch(new TimelineBarActions.SetLastLoadedDate({
                date: resp[resp.length - 1].timestamp,
              }));
            }
            this.lastRow = request.startRow + data.length;
            params.successCallback(data, data.length < (request.endRow - request.startRow) ? request.startRow + data.length : -1);
          } else {
            params.successCallback([], this.lastRow);
          }
        } else {
          params.failCallback();
        }
      }, (error: HttpErrorResponse) => {
        this.appStore.dispatch(new StreamDetailsActions.AddErrorMessage({
          message: error.error && error.error.message ? error.error.message : error.message,
        }));
        params.successCallback([], this.lastRow);
      });
  }

  destroy() {
    this.lastRow = 0;
  }
}
