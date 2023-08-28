import { Component, Input, OnDestroy, OnInit }                from '@angular/core';
import { select, Store }                                      from '@ngrx/store';
import equal                                                  from 'fast-deep-equal';
import { combineLatest, Observable, ReplaySubject, Subject }  from 'rxjs';
import { distinctUntilChanged, filter, map, take, takeUntil } from 'rxjs/operators';
import { AppState }                                           from '../../../../core/store';
import { NodeDetailsModel }                                   from '../../models/details.model';
import { VizceralConnection }                                 from '../../models/vizceral.extended.models';
import { FlowDataService }                                    from '../../services/flow-data.service';
import { getActiveNode }                                      from '../../store/flow.selectors';

@Component({
  selector: 'app-node-details',
  templateUrl: './node-details.component.html',
  styleUrls: ['./node-details.component.scss'],
})
export class NodeDetailsComponent implements OnInit, OnDestroy {
  @Input() isParent = false;
  
  selectedNodeView$: Observable<NodeDetailsModel>;
  showConnections$ = new ReplaySubject<string>(1);
  displayConnections$: Observable<VizceralConnection[]>;
  detailsType$: Observable<string>;
  
  private destroy$ = new Subject<any>();
  
  constructor(
    private appStore: Store<AppState>,
    private flowDataService: FlowDataService,
  ) {}
  
  ngOnInit(): void {
    this.selectedNodeView$ = this.appStore.pipe(
      select(getActiveNode),
      filter((node) => node?.type === 'node'),
    ) as Observable<NodeDetailsModel>;
    
    this.selectedNodeView$.pipe(
      distinctUntilChanged(equal),
      takeUntil(this.destroy$),
    ).subscribe(nodeView => {
      this.showConnections$.next(!!nodeView.incomingConnections.length ? 'incoming' : 'outgoing');
    });
    
    if (this.isParent) {
      this.selectedNodeView$.pipe(takeUntil(this.destroy$)).subscribe((node) => {
        const CONNECTIONS = [...node.incomingConnections, ...node.outgoingConnections].map(
            (connection) => ({
              source: connection.source.name,
              target: connection.target.name,
            }),
          ),
          HEADERS = {
            connections: JSON.stringify(CONNECTIONS) as unknown as string,
          };
        this.flowDataService.startMetadataSubscription(HEADERS);
      });
    }
    
    this.displayConnections$ = combineLatest([this.selectedNodeView$, this.showConnections$]).pipe(map(([nodeView, type]) => {
      return type === 'outgoing' ? nodeView.outgoingConnections : nodeView.incomingConnections;
    }));
    
    this.detailsType$ = this.showConnections$.pipe(map(type => type === 'incoming' ? 'cursors' : 'loaders'));
  }
  
  switchShowConnections(type: string) {
    this.showConnections$.next(type);
  }
  
  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    
    if (this.isParent) {
      this.flowDataService.stopMetadataSubscription();
    }
  }
}
