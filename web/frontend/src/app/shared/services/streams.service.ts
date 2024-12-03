import {HttpClient}                                    from '@angular/common/http';
import {Injectable}                                    from '@angular/core';
import {BehaviorSubject, Observable, Subject, of}                           from 'rxjs';
import {map, shareReplay, startWith, switchMap, tap}        from 'rxjs/operators';
import {PropsModel}                                    from '../../pages/streams/models/props.model';
import { StreamDescribeModel }                         from '../../pages/streams/models/stream.describe.model';
import {StreamModel}                                   from '../../pages/streams/models/stream.model';
import {StreamUpdatesService}                          from '../../pages/streams/services/stream-updates.service';
import * as fromStreamProps                            from '../../pages/streams/store/stream-props/stream-props.reducer';
import {CacheRequestService}                           from './cache-request.service';
import { FilterModel } from 'src/app/pages/streams/models/filter.model';
import { StorageService } from './storage.service';
import { NavigationEnd, Router } from '@angular/router';
import { streamNameUpdateData } from 'src/app/pages/streams/models/stream-update-data.model';

@Injectable({
  providedIn: 'root',
})
export class StreamsService {
  private cachedList$: Observable<StreamModel[]>;
  private listWithUpdates$: Observable<StreamModel[]>;
  private cashedRanges = {};
  private savedChartSettings: { [streamId: string]: FilterModel } = {};
  private savedChartTabSettings: { [tabId: string]: FilterModel } = {};
  symbolListUpdated = new Subject<void>();
  chartDraggedOrZoomed: boolean = false;

  streamNameUpdated = new Subject<streamNameUpdateData>();
  nonExistentStreamNavigated = new Subject<string>();

  streamCreationData: { storageVersion: string, distributionFactor: number };
  streamRemoved = new Subject<string>();
  streamPropsOpened: boolean;
  private rangeRequestsInProgress = {};
  barPeriods: { name: "string", aggregation: number }[] = [];
  chartLoaded$ = new Subject<void>();

  constructor(
    private httpClient: HttpClient,
    private cacheRequestService: CacheRequestService,
    private streamUpdatesService: StreamUpdatesService,
    private storageService: StorageService,
    private router: Router
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd && !event.url.includes('chart')) {
        this.removeChartSettings();
      }
    })

    this.savedChartTabSettings = JSON.parse(sessionStorage.getItem("savedChartTabSettings")) ?? {};
  }

  range(
    stream: string,
    symbol: string = null,
    spaceName: string = null,
    barSize = null,
  ): Observable<{end: string; start: string}> {
    const key = stream + symbol + spaceName + barSize;
    return this.httpClient
        .get<{end: string; start: string}>(`/${encodeURIComponent(stream)}/range`, {
          params: this.rangeParams(symbol, spaceName, barSize),
        })
        .pipe(
          map(({start, end}) => {
            let endTime = new Date(end).getTime();
            let startTime = new Date(start).getTime();
            if (startTime !== null && startTime === endTime) {
              startTime -= 1;
              if (!barSize) {
                endTime += 1;
              }
            }
            return {
              start: new Date(startTime).toISOString(),
              end: barSize
                ? new Date(endTime + barSize / 2).toISOString()
                : new Date(endTime).toISOString(),
            };
          }),
          shareReplay(1)
        );
  }

  rangeCached(
    stream: string,
    symbol: string,
    spaceName: string,
    barSize = null,
  ): Observable<{end: string; start: string}> {
    if (!stream) {
      return of(null);
    }
    const key = stream + symbol + spaceName + barSize;
    if (this.cashedRanges[key]) {
      return of(this.cashedRanges[key]);
    } else {
      return this.range(stream, symbol, spaceName, barSize)
        .pipe(tap(range => this.cashedRanges[key] = range));
    }
  }

  getListWithUpdates(): Observable<StreamModel[]> {
    if (!this.listWithUpdates$) {
      this.listWithUpdates$ = this.streamUpdatesService.onUpdates(['changed']).pipe(
        startWith(null),
        switchMap(() => this.getList(false)),
        shareReplay(1),
      );
    }

    return this.listWithUpdates$;
  }

  getList(useCache, filter: string = null, spaces: boolean = null): Observable<StreamModel[]> {
    const params = [];
    if (filter?.length) {
      params.push(`filter=${encodeURIComponent(filter)}`);
    }

    if (spaces) {
      params.push('spaces=true');
    }

    const req = '/streams' + (params.length ? `?${params.join('&')}` : '');
    const canGetCache = !params.length;

    if (useCache && canGetCache && this.cachedList$) {
      return this.cachedList$;
    }

    const streams$ = this.httpClient.get<StreamModel[]>(req).pipe(
      map((resp) =>
        resp.sort((a, b) =>
          a.key.toLowerCase() > b.key.toLowerCase()
            ? 1
            : b.key.toLowerCase() > a.key.toLowerCase()
            ? -1
            : 0,
        ),
      ),
      shareReplay(1),
    );

    if (canGetCache) {
      this.cachedList$ = streams$;
    }

    return streams$;
  }

  getProps(stream: string, fromCache: boolean = true): Observable<fromStreamProps.State> {
    const props$ = this.httpClient
      .get<PropsModel>(`/${encodeURIComponent(stream)}/options`, {
        headers: {customError: 'true'},
      })
      .pipe(map((resp) => ({props: resp || null, opened: false})));

    if (fromCache) {
      return this.cacheRequestService.cache(
        {action: 'StreamsService.getProps', stream},
        props$,
      );
    } else {
      return props$;
    }
  }
  
  describe(streamId: string): Observable<StreamDescribeModel> {
    return this.httpClient.get<StreamDescribeModel>(`${encodeURIComponent(streamId)}/describe`);
  }

  private rangeParams(symbol: string, spaceName: string, barSize: number) {
    return {
      ...(symbol ? {symbols: symbol} : {}),
      ...(typeof spaceName === 'string' ? {spaceName} : {}),
      ...(barSize ? {barSize} : {}),
    };
  }

  updateStreamProperties(streamId: string, props) {
    return this.httpClient.put(`${encodeURIComponent(streamId)}/options`, props);
  }

  getChartSettings(key: string) {
    const savedChartSettings = JSON.parse(sessionStorage.getItem("savedChartSettings"));
    return savedChartSettings?.[key];
  }

  updateChartSettings(key: string, settings: object) {
    this.savedChartSettings = { [key]: { ...this.savedChartSettings[key], ...settings } };
    sessionStorage.setItem("savedChartSettings", JSON.stringify(this.savedChartSettings));
  }

  removeChartSettings() {
    sessionStorage.removeItem("savedChartSettings");
  }

  getChartTabSettings(tabId: string) {
    const savedChartSettings = JSON.parse(sessionStorage.getItem("savedChartTabSettings"));
    return savedChartSettings?.[tabId];
  }

  updateChartTabSettings(tabId: string, settings: object) {
    const tabIds = this.storageService.getTabs().map(tab => tab.id);

    Object.keys(this.savedChartTabSettings).forEach(key => {
      if (!tabIds.includes(key)) {
        delete this.savedChartTabSettings[key];
      }
    });

    this.savedChartTabSettings = { 
      ...this.savedChartTabSettings, 
      [tabId]: { ...this.savedChartTabSettings[tabId], ...settings }
    };
    sessionStorage.setItem("savedChartTabSettings", JSON.stringify(this.savedChartTabSettings));
  }

  validateStreamName(name: string) {
    const params = { key: name };
    return this.httpClient.get('/validate/stream/key', { params });
  }
}
