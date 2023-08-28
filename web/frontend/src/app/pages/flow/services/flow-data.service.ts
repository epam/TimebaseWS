import { HttpClient }                                                      from '@angular/common/http';
import { Injectable }                                                      from '@angular/core';
import { StompHeaders }                                                    from '@stomp/stompjs';
import { BehaviorSubject, merge, Observable, Subject }                     from 'rxjs';
import { distinctUntilChanged, filter, shareReplay, switchMap, takeUntil, startWith } from 'rxjs/operators';
import { WSService }                                                       from '../../../core/services/ws.service';
import { WSRResponseMetadataModel }                                        from '../models/metadata.model';
import { InitialNodePositions, NodePositions }                            from '../models/node-positions.types';
import { TrafficModel }                                                    from '../models/traffic.model';

@Injectable({
  providedIn: 'root',
})
export class FlowDataService {
  private stopMetadataSubscription$ = new Subject<boolean>();
  private subscribedToMetadata = false;
  private metadataNodeDetails$: Observable<WSRResponseMetadataModel[]>;
  private metadata$: Observable<WSRResponseMetadataModel[]>;
  private flowData$: Subject<TrafficModel> = new Subject<TrafficModel>();
  private layout$ = new BehaviorSubject<string>(null);
  private flow$: Observable<TrafficModel>;
  private nullFlow$ = new Subject<null>();
  private topologyManuallyChanged$ = new Subject<void>();
  private headers: StompHeaders;
  
  public lastTreeTopologyPositions: NodePositions;
  public lastStarTopologyPositions: NodePositions;
  public initialPositions_ltrTree: InitialNodePositions = {};
  public initialPositions_ringCenter: InitialNodePositions = {};
  
  constructor(
    private httpClient: HttpClient,
    private wsService: WSService,
  ) {
    const data$ = this.layout$.pipe(
      filter(layout => layout !== null),
      distinctUntilChanged(),
      switchMap(layout => merge(
        this.httpClient.get<TrafficModel>('/flowchart', {params: {layout}}),
        this.wsService.watchObject<TrafficModel>(`/topic/flowchart/${layout}`),
      )));
    
    this.flow$ = merge(data$, this.nullFlow$).pipe(
      distinctUntilChanged(),
      shareReplay({bufferSize: 1, refCount: true}),
      filter(t => !!t),
    );
  }
  
  updateLayout(layout: string) {
    const oldLayout = this.layout$.getValue();
    this.layout$.next(layout);
    if (layout !== oldLayout) {
      this.nullFlow$.next(null);
    }
  }
  
  topologyManuallyChanged() {
    this.topologyManuallyChanged$.next();
  }
  
  onTopologyManuallyChanged(): Observable<void> {
    return this.topologyManuallyChanged$.asObservable();
  }
  
  flow(): Observable<TrafficModel> {
    this.nullFlow$.next(null);
    return this.flow$;
  }
  
  getFlowDataLink$(): Observable<TrafficModel> {
    return this.flowData$.asObservable();
  }
  
  getFlowData$(): Observable<TrafficModel> {
    return this.flowData$.asObservable();
  }
  
  getMetadata$(): Observable<WSRResponseMetadataModel[]> {
    if (!this.subscribedToMetadata) {
      this.metadataNodeDetails$ = this.requestFlowMetadata(this.headers);
      this.subscribedToMetadata = true;
      this.metadata$.subscribe();
    }
    return this.metadata$.pipe(
      switchMap(metadata => this.metadataNodeDetails$.pipe(startWith(metadata)))
    );
  }

  requestFlowMetadata(headers: StompHeaders): Observable<WSRResponseMetadataModel[]> {
    return this.wsService.watchObject<WSRResponseMetadataModel[]>('/user/topic/flowchart/metadata', headers);
  }
  
  startMetadataSubscription(headers: StompHeaders): void {
    if (!headers) {
      return;
    }
    this.headers = headers;
    this.stopMetadataSubscription();
    this.metadata$ = this.requestFlowMetadata(headers).pipe(
      shareReplay(1),
      takeUntil(this.stopMetadataSubscription$),
    );
  }
  
  stopMetadataSubscription(): void {
    this.stopMetadataSubscription$.next(true);
    this.stopMetadataSubscription$.complete();
    this.stopMetadataSubscription$ = new Subject<boolean>();
  }
}
