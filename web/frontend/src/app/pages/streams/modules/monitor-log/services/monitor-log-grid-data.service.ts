import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {StompHeaders} from '@stomp/stompjs';
import {Subject} from 'rxjs';
import {
  filter,
  map,
  switchMap,
  take,
  takeUntil,
  tap,
  throttleTime,
  withLatestFrom,
} from 'rxjs/operators';
import {WSService} from '../../../../../core/services/ws.service';
import {AppState} from '../../../../../core/store';
import {getAppVisibility} from '../../../../../core/store/app/app.selectors';
import {SchemaTypesMap} from '../../../../../shared/models/schema.type.model';
import {StreamDetailsModel} from '../../../models/stream.details.model';
import {TabModel} from '../../../models/tab.model';
import {WSLiveModel} from '../../../models/ws-live.model';
import {getActiveOrFirstTab} from '../../../store/streams-tabs/streams-tabs.selectors';

@Injectable({
  providedIn: 'root',
})
export class MonitorLogGridDataService {
  private destroy$ = new Subject();
  private subscription$: Subject<{data: StreamDetailsModel[]; newDataLength?: number}>;
  private rowsStore: StreamDetailsModel[] = [];

  constructor(
    private appStore: Store<AppState>,
    private wsService: WSService,
    private httpClient: HttpClient,
  ) {}

  public getSubscription(url: string, dataObj: WSLiveModel, schemaMap: SchemaTypesMap) {
    const FROM_DATE = new Date();
    if (this.subscription$) {
      this.subscription$.complete();
    }
    this.subscription$ = new Subject();

    const stompHeaders: StompHeaders = {};
    Object.keys(dataObj).forEach((key) => {
      if (typeof dataObj[key] !== 'object') {
        stompHeaders[key] = dataObj[key] + '';
      } else if (dataObj[key] && typeof dataObj[key] === 'object') {
        stompHeaders[key] = JSON.stringify(dataObj[key]);
      }
    });
    stompHeaders['fromTimestamp'] = FROM_DATE.toISOString();
    // if (dataObj.space) {
    //
    // }
    this.appStore
      .pipe(select(getActiveOrFirstTab))
      .pipe(
        take(1),
        switchMap((activeTab: TabModel) => {
          let params = {},
            httpUrl;
          const filter = activeTab.filter || {};
          if (activeTab.symbol) {
            httpUrl = `${encodeURIComponent(activeTab.stream)}/${encodeURIComponent(
              activeTab.symbol,
            )}`;
          } else {
            httpUrl = `${encodeURIComponent(activeTab.stream)}`;
          }
          httpUrl += '/select';
          params = {
            ...params,
            offset: 0,
            rows: 100,
            reverse: true,
          };
          Object.keys(filter).forEach((key) => {
            if (
              key != null &&
              key !== 'filter_symbols' &&
              key !== 'filter_types' &&
              // && filter[key] !== 'tabName'
              key !== 'filter_date_format' &&
              key !== 'filter_time_format'
            ) {
              params[key] = filter[key];
            } else if (key === 'filter_symbols') {
              params['symbols'] = filter[key];
            } else if (key === 'filter_types') {
              params['types'] = filter[key];
            }
          });
          if (!params['from']) params['from'] = FROM_DATE.toISOString();

          if (typeof activeTab.space === 'string') {
            params['space'] = encodeURIComponent(activeTab.space);
          }
          return this.httpClient.post<StreamDetailsModel[]>(httpUrl, params);
        }),
        map((data) => {
          this.rowsStore = data
            .map((row) => new StreamDetailsModel(row, schemaMap))
            .sort((row1, row2) => {
              const TIME2 = new Date(row2.timestamp).getTime(),
                TIME1 = new Date(row1.timestamp).getTime();
              if (TIME2 < TIME1) {
                return -1;
              } else if (TIME1 === TIME2) {
                return 0;
              }
              return 1;
            });
          return {
            data: this.rowsStore,
          };
        }),
        tap((data) => this.subscription$.next(data)),
        switchMap(() =>
          this.wsService.watch(url, stompHeaders, {destination: url}).pipe(
            withLatestFrom(this.appStore.select(getAppVisibility)),
            filter(
              ([ws_data, app_is_visible]: [any, boolean]) =>
                app_is_visible /* && !!(this.readyApi && this.readyApi.api)*/,
            ),
            map(([ws_data]) => ws_data),
            map((ws_data) =>
              JSON.parse(ws_data.body).map((row) => new StreamDetailsModel(row, schemaMap)),
            ),
            map((data: StreamDetailsModel[]) => {
              this.rowsStore = [...this.rowsStore, ...data].sort((row1, row2) => {
                const TIME2 = new Date(row2.timestamp).getTime(),
                  TIME1 = new Date(row1.timestamp).getTime();
                if (TIME2 < TIME1) {
                  return -1;
                } else if (TIME1 === TIME2) {
                  return 0;
                }
                return 1;
              });
              this.rowsStore.splice(100, this.rowsStore.length - 100);
              return {
                data: this.rowsStore,
                newDataLength: Math.min(data.length, this.rowsStore.length),
              };
            }),
            throttleTime(500),
            takeUntil(this.destroy$),
          ),
        ),
      )
      .subscribe((data) => this.subscription$.next(data));
    return this.subscription$.pipe(takeUntil(this.destroy$));
  }

  public destroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.destroy$ = new Subject();
  }
}
