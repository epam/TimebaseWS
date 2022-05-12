import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
}                            from '@angular/core';
import { VizceralComponent } from '@deltix/ngx-vizceral';
import { select, Store }     from '@ngrx/store';
import equal                 from 'fast-deep-equal';

import { Observable, Subject, timer } from 'rxjs';
import {
  auditTime,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  takeUntil,
  withLatestFrom,
}                                     from 'rxjs/operators';
import { AppState }                   from '../../../../core/store';
import { SplitterSizesDirective }     from '../../../../shared/components/splitter-sizes/splitter-sizes.directive';
import { ResizeObserveService }       from '../../../../shared/services/resize-observe.service';
import {
  ConnectionDetailsModel,
  NodeDetailsModel,
  ShortConnectionDetailsModel,
  ShortNodeDetailsModel,
}                                     from '../../models/details.model';
import { TrafficModel }               from '../../models/traffic.model';
import { COLOR_TRAFFIC }              from '../../models/traffic.node.model';
import {
  VizceralConnection,
  VizceralNode,
}                                     from '../../models/vizceral.extended.models';
import { FlowDataService }            from '../../services/flow-data.service';
import {
  ClearActiveNode,
  LoadDataFilter,
  SetActiveNode,
}                                     from '../../store/flow.actions';
import {
  getActiveNode,
  getDataFilter,
  getFilteredNodes,
}                                     from '../../store/flow.selectors';

@Component({
  selector: 'app-flow',
  templateUrl: './flow.component.html',
  styleUrls: ['./flow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(VizceralComponent, {static: false}) vizceralComponent: VizceralComponent;
  @ViewChild('vizceralRef', {static: false}) vizceralRef: ElementRef;
  @ViewChild('filterPanel') private filterPanel: ElementRef;
  @ViewChild('pageDivider') private pageDivider: ElementRef;
  public vizceralTopPosition = 100;
  // public traffic: any = {};
  public traffic$: Subject<TrafficModel> = new Subject<TrafficModel>();
  // public flowFilter$: Observable<VizceralFilterModel>;
  public flowFilter$: Observable<string[]>;
  public particleSystemEnabled = false;
  public path: string[] = [];
  public renderVars = {
    resetLayout: true,
  };
  public detailsOff = true;
  public initialSize: {
    width: number;
    height: number;
  };
  
  public objectToHighlight;
  public selectedNode$: Subject<VizceralConnection | VizceralNode | null> = new Subject();
  public selectedNodeView$: Observable<ConnectionDetailsModel | NodeDetailsModel | null>;
  
  private destroy$ = new Subject<any>();
  private currentGraph: any = null;
  private typedText = '';
  
  constructor(
    private flowDataService: FlowDataService,
    private cdRef: ChangeDetectorRef,
    private appStore: Store<AppState>,
    private parentSplitterSizes: SplitterSizesDirective,
    private resizeObserveService: ResizeObserveService,
  ) {}
  
  get graph() {
    return this.currentGraph;
  }
  
  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.flowDataService.stopFlowDataSubscription();
  }
  
  ngAfterViewInit(): void {
    // (this.vizceralComponent?.vizceral() as VizceralGraph)?.setFilters([
    //   {
    //     name: 'Name filter', // A unique name for the filter
    //     type: 'connection', // What object type the filter applies to ('node' or 'connection')
    //     passes: (object, value) => { // The function to compare a value of object to the current value
    //       // debugger
    //       return object.source.name.match(".*m.*")?.length > 0 || object.target.name.match(".*m.*")?.length > 0;
    //       // return value < 0 || object.src <= value;
    //     },
    //     value: -1 // The current value of the filter
    //   }
    // ])
    this.updateSize();
    this.resizeObserveService
      .observe(this.filterPanel.nativeElement)
      .pipe(takeUntil(this.destroy$), debounceTime(100))
      .subscribe(() => {
        this.updateSize();
      });
    
    this.appStore
      .pipe(select(getDataFilter), filter(Boolean), takeUntil(this.destroy$))
      .subscribe(() => {
        this.renderVars = {
          ...this.renderVars,
          resetLayout: true,
        };
        this.cdRef.detectChanges();
        this.renderVars = {
          ...this.renderVars,
          resetLayout: false,
        };
        this.cdRef.detectChanges();
        setTimeout(() => {
          this.initialSize = {
            width: this.vizceralRef.nativeElement.offsetWidth * 2,
            height: this.vizceralRef.nativeElement.offsetHeight * 1.5,
          };
          this.getTrafficFlow();
          this.subscribeWs();
          timer().subscribe(() => this.parentSplitterSizes.setChildMinSize(1, 500));
        }, 100);
      });
  }
  
  updateSize() {
    const pageDividerEl = this.pageDivider.nativeElement;
    this.vizceralTopPosition = pageDividerEl.offsetTop + pageDividerEl.offsetHeight;
  }
  
  updateGraph() {}
  
  filterNodeByConnection(node, value: string[]): boolean {
    const CONNECTIONS = [...(node.incomingConnections || []), ...(node.outgoingConnections || [])];
    const result = CONNECTIONS.some(connection => {
      return (connection?.source?.name && value.some(name => name === connection.source.name)) ||
        (connection?.target?.name && value.some(name => name === connection.target.name));
    });
    return result;
  }
  
  ngOnInit(): void {
    this.appStore.dispatch(LoadDataFilter());
    this.selectedNodeView$ = this.appStore.pipe(select(getActiveNode));
    this.flowFilter$ = this.appStore.pipe(
      select(getFilteredNodes),
      // tap(nodes => console.log('filtered_nodes', nodes)),
      // map(nodes => nodes.map(node => new VizceralFilterModel(node))),
      map((nodes) => nodes.map((node) => node.name)),
    );
    
    this.flowFilter$
      .pipe()
      .subscribe(filterNodes => {
        (this.vizceralComponent?.vizceral() as any)?.setFilters(
          [{
            name: 'name', // A unique name for the filter
            type: 'node', // What object type the filter applies to ('node' or 'connection')
            passes: (node, value: string[]) => { // The function to compare a value of object to the current value
              if (!value?.length) return true;
              const node_filtered_by_name = value.some(name => name === node.name);
              const node_filtered_by_connection = this.filterNodeByConnection(node, value);
              return node_filtered_by_name || node_filtered_by_connection;
            },
            value: filterNodes, // The current value of the filter
          }],
        );
      });
    this.selectedNodeView$
      .pipe(
        filter((node) => node === null),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        (this.vizceralComponent?.vizceral() as any)?.setHighlightedNode(undefined);
      });
    
    this.selectedNodeView$.pipe(takeUntil(this.destroy$)).subscribe((node) => {
      console.log('selected node', node);
    });
    
    this.selectedNode$
      .pipe(
        auditTime(500),
        distinctUntilChanged((previous, current) => {
          if (
            (previous == null && current) ||
            (previous && current == null) ||
            previous?.type !== current?.type
          ) {
            return false;
          }
          let isEqual = false;
          switch (current?.type) {
            case 'node':
              isEqual = equal(
                new ShortNodeDetailsModel(previous as VizceralNode),
                new ShortNodeDetailsModel(current as VizceralNode),
              );
              break;
            case 'connection':
              isEqual = equal(
                new ShortConnectionDetailsModel(previous as VizceralConnection),
                new ShortConnectionDetailsModel(current as VizceralConnection),
              );
              break;
            default:
              break;
          }
          return isEqual;
        }),
        withLatestFrom(this.traffic$),
      )
      .subscribe(([selectedItem, traffic]: [VizceralNode | VizceralConnection | null, any]) => {
        switch (selectedItem?.type) {
          case 'connection':
            this.appStore.dispatch(
              SetActiveNode({
                node: new ConnectionDetailsModel(selectedItem, traffic),
              }),
            );
            break;
          case 'node':
            this.appStore.dispatch(
              SetActiveNode({
                node: new NodeDetailsModel(selectedItem, traffic),
              }),
            );
            break;
          default:
            this.appStore.dispatch(ClearActiveNode());
        }
      });
  }
  
  
  viewUpdated(event) {
    // no arguments
    // console.log(`[view Updated]`, event);
  }
  
  objectHighlighted(event: VizceralNode | VizceralConnection | null) {
    // event = node or connection
    // console.log(`object highlighted`, event);
    this.objectToHighlight = event;
    this.selectedNode$.next(event);
    // if (event) {
    // }
  }
  
  viewChanged(event) {
    console.log(`[view changed]`, event);
    
    this.path = event.view;
    
    const graph: any = event.graph as any;
    if (!!graph) {
      // console.log("GRAPH:");
      // console.log(graph);
      this.currentGraph = event.graph;
      
      graph.setPhysicsOptions({
        ...graph.getPhysicsOptions(),
        isEnabled: this.particleSystemEnabled,
      });
    } else {
      this.currentGraph = null;
    }
    
    (this.vizceralComponent?.vizceral() as any)?.updateStyles({
      colorTraffic: COLOR_TRAFFIC,
    });
    
    // this.cdRef.detectChanges();
  }
  
  toggleParticleSystem() {
    this.particleSystemEnabled = !this.particleSystemEnabled;
    
    if (!!this.currentGraph) {
      this.currentGraph.setPhysicsOptions({
        ...this.currentGraph.getPhysicsOptions(),
        isEnabled: this.particleSystemEnabled,
      });
    }
  }
  
  matchesFound() {
    // console.log('matches found');
  }
  
  nodeContextSizeChanged() {
    // console.log('node Context Size Changed');
  }
  
  public onLocate(searchText: string) {
    this.vizceralComponent.locate(searchText);
  }
  
  breadCrumbClicked(newPath: string[]) {
    // console.log(`Changing view to [${newPath}]`);
    this.path = newPath;
    this.vizceralComponent.setView(newPath);
  }
  
  configureParticleSystem() {
    // this.simpleModalService
    //   .addModal(CreateOrderComponent, {
    //     // title: `Leave page`,
    //     // message: `Are you sure you want to leave page without saving changes?`,
    //     // confirmWord: 'Stay and continue editing',
    //     // rejectWord: 'Leave without saving',
    //   }).subscribe();
  }
  
  resetLayout() {
    this.typedText = null;
    if (this.currentGraph) {
      this.currentGraph._relayout();
    }
    
    this.renderVars = {
      ...this.renderVars,
      resetLayout: true,
    };
    this.cdRef.detectChanges();
    this.renderVars = {
      ...this.renderVars,
      resetLayout: false,
    };
    this.cdRef.detectChanges();
  }
  
  public hideDetailsPanel() {
    this.toggleDetailsPanel(false);
  }
  
  private getTrafficFlow() {
    console.log('Requesting traffic from server: ');
    this.flowDataService
      .getFlowDataByRequest$()
      .pipe(
        // withLatestFrom(this.flowFilter$.pipe(filter(Boolean))),
        // map(([trafficData, flowFilter]: [TrafficModel, string[]]) => {
        //   return trafficData;
        //   // if (!flowFilter?.length) return trafficData;
        //   // return {
        //   //   ...trafficData,
        //   //   nodes: trafficData.nodes.filter((node) =>
        //   //     flowFilter.some((name) => name === node.name),
        //   //   ),
        //   //   connections: trafficData.connections.filter((connection) =>
        //   //     flowFilter.some((name) => name === connection.source || name === connection.target),
        //   //   ),
        //   // };
        // }),
        takeUntil(this.destroy$),
      )
      .subscribe(
        (trafficData: TrafficModel) => {
          // this.ngxService.stopLoader('loader-07');
          // console.log('HTTP: Received traffic from server');
          this.traffic$.next({...trafficData});
          // this.cdRef.detectChanges();
        },
        (e) => {
          // this.alertsService.processError('Error getting flow chart!', e);
          console.error(e);
        },
      ); // , () => {this.updateGraph()}
  }
  
  private subscribeWs() {
    // combineLatest([this.flowDataService.getFlowData$(), this.flowFilter$.pipe(filter(Boolean))])
    //   .pipe(
    //     map(([trafficData, flowFilter]: [TrafficModel, string[]]) => {
    //       if (!flowFilter?.length) return trafficData;
    //       return {
    //         ...trafficData,
    //         nodes: trafficData.nodes.filter((node) =>
    //           flowFilter.some((name) => name === node.name),
    //         ),
    //         connections:
    //           flowFilter.length <= 1
    //             ? []
    //             : trafficData.connections.filter((connection) =>
    //                 flowFilter.some(
    //                   (name) =>
    //                     name === connection.source &&
    //                     flowFilter.some((name) => name === connection.target),
    //                 ),
    //               ),
    //       };
    //     }),
    //   )
    this.flowDataService.getFlowData$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((trafficData: TrafficModel) => {
        // console.log('WS (pooling): Received traffic snapshot from server');
        // console.log(trafficData?.nodes?.filter(data => data.name === '<none>')[0]); // TODO: Delete this before checkIN
        this.traffic$.next({...trafficData});
        // this.cdRef.detectChanges();
      });
  }
  
  private toggleDetailsPanel(show: boolean): void {
    this.detailsOff = !show;
  }
}
