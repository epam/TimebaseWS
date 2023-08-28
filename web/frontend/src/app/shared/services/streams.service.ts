import {HttpClient}                                    from '@angular/common/http';
import {Injectable}                                    from '@angular/core';
import {Observable, Subject, of}                           from 'rxjs';
import {map, shareReplay, startWith, switchMap, tap}        from 'rxjs/operators';
import { streamNameUpdateData, StreamPeriodicityUpdateData } from 'src/app/pages/streams/models/stream-update-data.model';
import {PropsModel}                                    from '../../pages/streams/models/props.model';
import { StreamDescribeModel }                         from '../../pages/streams/models/stream.describe.model';
import {StreamModel}                                   from '../../pages/streams/models/stream.model';
import {StreamUpdatesService}                          from '../../pages/streams/services/stream-updates.service';
import * as fromStreamProps                            from '../../pages/streams/store/stream-props/stream-props.reducer';
import {CacheRequestService}                           from './cache-request.service';

@Injectable({
  providedIn: 'root',
})
export class StreamsService {
  private cachedList$: Observable<StreamModel[]>;
  private listWithUpdates$: Observable<StreamModel[]>;
  private cashedRanges = {};

  streamNameUpdated = new Subject<streamNameUpdateData>();
  streamPeriodicityUpdated = new Subject<StreamPeriodicityUpdateData>();
  updatedPeriodicity = {};
  nonExistentStreamNavigated = new Subject<string>();

  streamRemoved = new Subject<string>();

  constructor(
    private httpClient: HttpClient,
    private cacheRequestService: CacheRequestService,
    private streamUpdatesService: StreamUpdatesService,
  ) {}

  range(
    stream: string,
    symbol: string = null,
    spaceName: string = null,
    barSize = null,
  ): Observable<{end: string; start: string}> {
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

  getProps(stream: string): Observable<fromStreamProps.State> {
    return this.cacheRequestService.cache(
      {action: 'StreamsService.getProps', stream},
      this.httpClient
        .get<PropsModel>(`/${encodeURIComponent(stream)}/options`, {
          headers: {customError: 'true'},
        })
        .pipe(map((resp) => ({props: resp || null, opened: false}))),
    );
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
}
