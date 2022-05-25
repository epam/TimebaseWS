import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable, Subject} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {AppState} from '../../../../core/store';
import {NodeDetailsModel} from '../../models/details.model';
import {FlowDataService} from '../../services/flow-data.service';
import {getActiveNode} from '../../store/flow.selectors';

@Component({
  selector: 'app-node-details',
  templateUrl: './node-details.component.html',
  styleUrls: ['./node-details.component.scss'],
})
export class NodeDetailsComponent implements OnInit, OnDestroy {
  @Input() isParent = false;
  public selectedNodeView$: Observable<NodeDetailsModel>;
  public showContent = true;
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
    this.selectedNodeView$ = this.appStore.pipe(
      select(getActiveNode),
      filter((node) => node?.type === 'node'),
    ) as Observable<NodeDetailsModel>;

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
  }
}
