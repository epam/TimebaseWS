import { HttpClient }                             from '@angular/common/http';
import { Injectable }                             from '@angular/core';
import { select, Store }                          from '@ngrx/store';
import { StompHeaders }                           from '@stomp/stompjs';
import { Observable, Subject }                    from 'rxjs';
import { map, share, switchMap, take, takeUntil } from 'rxjs/operators';
import { WSService }                              from '../../../core/services/ws.service';
import { AppState }                               from '../../../core/store';
import { WSRResponseMetadataModel }               from '../models/metadata.model';
import { TopologyTypeModel }                      from '../models/topologyType.model';
import { TrafficModel }                           from '../models/traffic.model';
import { getActiveTopology }                      from '../store/flow.selectors';

@Injectable({
  providedIn: 'root',
})
export class FlowDataService {
  private stopMetadataSubscription$ = new Subject<boolean>();
  private stopFlowDataSubscription$ = new Subject<boolean>();

  private metadata$: Observable<WSRResponseMetadataModel[]>;
  private flowData$: Subject<TrafficModel> = new Subject<TrafficModel>();

  constructor(
    private httpClient: HttpClient,
    private wsService: WSService,
    private appStore: Store<AppState>,
  ) {}

  public getFlowDataByRequest$(): Observable<any> {
    return this.appStore.pipe(
      select(getActiveTopology),
      take(1),
      switchMap((topology: TopologyTypeModel) =>
        this.httpClient.get<TrafficModel>('/flowchart', {
          params: {
            layout: topology.type,
          },
        }),
      ),
    );
  }

  public getFlowDataLink$(): Observable<TrafficModel> {
    return this.flowData$.asObservable();
  }

  public getFlowData$(): Observable<TrafficModel> {
    this.startFlowDataSubscription();
    return this.flowData$.asObservable();
  }

  public startFlowDataSubscription(): void {
    this.stopFlowDataSubscription();
    this.appStore
      .pipe(
        select(getActiveTopology),
        take(1),
        switchMap((topology: TopologyTypeModel) =>
          this.wsService.watch(`/topic/flowchart/${topology.type || ''}`),
        ),
        map((resp) => {
          return JSON.parse(resp.body) as TrafficModel;
        }),
        // tap(resp => {
        // console.log(resp/*?.connections?.find(connection => connection.source === 'securities')?.metadata?.cursors?.length*/); //
        // }),
        share(),
        takeUntil(this.stopFlowDataSubscription$),
      )
      .subscribe((data) => this.flowData$.next(data));
  }

  public stopFlowDataSubscription(): void {
    this.stopFlowDataSubscription$.next(true);
    this.stopFlowDataSubscription$.complete();
    this.stopFlowDataSubscription$ = new Subject<boolean>();
    this.flowData$.next(null);
  }

  public getMetadata$(): Observable<WSRResponseMetadataModel[]> {
    return this.metadata$;
  }

  public startMetadataSubscription(headers: StompHeaders): void {
    if (!headers) {
      return;
    }
    this.stopMetadataSubscription();
    this.metadata$ = this.wsService.watch('/user/topic/flowchart/metadata', headers).pipe(
      map((resp) => {
        return JSON.parse(resp.body) as WSRResponseMetadataModel[];
      }),
      // tap(resp => {
      //   console.log('[/user/topic/flowchart/metadata]',
      //     resp/*?.connections?.find(connection => connection.source === 'securities')?.metadata?.cursors?.length*/); // TODO: Delete this before checkIN
      // }),
      share(),
      takeUntil(this.stopMetadataSubscription$),
    );
  }

  public stopMetadataSubscription(): void {
    this.stopMetadataSubscription$.next(true);
    this.stopMetadataSubscription$.complete();
    this.stopMetadataSubscription$ = new Subject<boolean>();
  }
}
