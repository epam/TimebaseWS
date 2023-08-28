import { Component, HostBinding, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { select, Store }                                                  from '@ngrx/store';
import { BsModalService }                                                     from 'ngx-bootstrap/modal';
import { Observable, of, Subject }                                            from 'rxjs';
import { filter, map, withLatestFrom, takeUntil } from 'rxjs/operators';
import { AppState }                                                           from '../../../../core/store';
import { ConnectionDetailsModel }                                             from '../../models/details.model';
import { CursorMetadataModel, LoaderMetadataModel, WSRResponseMetadataModel } from '../../models/metadata.model';
import { COLOR_TRAFFIC }                                                      from '../../models/traffic.node.model';
import { FlowDataService }                                                    from '../../services/flow-data.service';
import { getActiveNode }                                                      from '../../store/flow.selectors';
import { ConnectionModalComponent }                                           from '../connection-modal/connection-modal.component';

@Component({
  selector: 'app-connection-details',
  templateUrl: './connection-details.component.html',
  styleUrls: ['./connection-details.component.scss'],
})
export class ConnectionDetailsComponent implements OnInit, OnDestroy {
  @Input() isParent = false;
  @Input() nodeConnection: ConnectionDetailsModel;
  @HostBinding('class.in-modal') @Input() showTables: boolean;
  
  showContent = true;
  selectedConnectionView$: Observable<ConnectionDetailsModel>;
  metadata$: Observable<WSRResponseMetadataModel | null>;
  gridCursorsOptions;
  gridLoadersOptions;
  colors = COLOR_TRAFFIC;
  loadersLength$: Observable<number>;
  loadersRPS$: Observable<number>;
  cursorsLength$: Observable<number>;
  cursorsRPS$: Observable<number>;
  loaders$: Observable<LoaderMetadataModel[]>;
  cursors$: Observable<CursorMetadataModel[]>;
  
  private destroy$ = new Subject<any>();

  constructor(
    private appStore: Store<AppState>,
    private flowDataService: FlowDataService,
    private bsModalService: BsModalService,
  ) {}
  
  @HostListener('click') onClick() {
    if (!this.showTables) {
      this.bsModalService.show(ConnectionModalComponent, {
        initialState: {connection: this.nodeConnection},
        class: 'scroll-content-modal',
      });
    }
  }

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
      takeUntil(this.destroy$)
    );
    
    const round = val => Math.round(val * 1000) / 1000;
    const metaDataCountRps = (attribute: string) => this.metadata$.pipe(
      map(metadata => metadata?.[attribute]?.reduce((sum, item) => sum + item.rps, 0) || 0),
      map(round),
    );
  
    this.loadersRPS$ =  metaDataCountRps('loaders');
    this.cursorsRPS$ =  metaDataCountRps('cursors');
    this.loadersLength$ =  this.metadata$.pipe(map(metadata => metadata?.loaders?.length || 0));
    this.cursorsLength$ =  this.metadata$.pipe(map(metadata => metadata?.cursors?.length || 0));
    this.loaders$ = this.metadata$.pipe(map(metadata => metadata?.loaders.map(l => ({...l, rps: round(l.rps)}))));
    this.cursors$ = this.metadata$.pipe(map(metadata => metadata?.cursors.map(l => ({...l, rps: round(l.rps)}))));
  }
}
