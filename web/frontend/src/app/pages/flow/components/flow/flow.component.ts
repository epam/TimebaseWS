import {
  AfterViewInit,
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
import { BehaviorSubject, combineLatest, interval, Observable, of, ReplaySubject, Subject, timer } from 'rxjs';
import {
  auditTime, delay,
  distinctUntilChanged,
  filter,
  map, startWith, switchMap,
  takeUntil, tap,
  withLatestFrom, pluck
}                                                                                                  from 'rxjs/operators';
import { AppState }                                                                                from '../../../../core/store';
import { RightPaneService }                                                                        from '../../../../shared/right-pane/right-pane.service';
import { TabStorageService }                                                                       from '../../../../shared/services/tab-storage.service';
import { filterNodesWithCloseCoordinate } from '../../helpers/flow.helpers';
import {
  ConnectionDetailsModel,
  NodeDetailsModel,
  ShortConnectionDetailsModel,
  ShortNodeDetailsModel,
}                                                                                                  from '../../models/details.model';
import { FlowFilter }                                                                              from '../../models/flow-filter';
import { 
  InitialNodePositions,
  NodeCoordinates, 
  NodeCoordinatesOutOfView, 
  NodePositions,
  NodesOutOfView,
} from '../../models/node-positions.types';
import { TrafficModel }                                                                            from '../../models/traffic.model';
import { COLOR_TRAFFIC }                                                                           from '../../models/traffic.node.model';
import {
  VizceralConnection,
  VizceralNode,
}                                                                                                  from '../../models/vizceral.extended.models';
import { FlowDataService }                                                                         from '../../services/flow-data.service';
import {
  ClearActiveNode,
  LoadDataFilter,
  SetActiveNode,
}                                                                                                  from '../../store/flow.actions';
import { getActiveNode }                                                                           from '../../store/flow.selectors';

@Component({
  selector: 'app-flow',
  templateUrl: './flow.component.html',
  styleUrls: ['./flow.component.scss'],
  providers: [RightPaneService, TabStorageService],
})
export class FlowComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(VizceralComponent) vizceralComponent: VizceralComponent;
  vizceralDefStyles = {colorTraffic: COLOR_TRAFFIC};
  traffic$: Observable<TrafficModel>;
  particleSystemEnabled = false;
  path: string[] = [];
  detailsOff = true;
  initialSize: { width: number, height: number };
  selectedNode$: Subject<VizceralConnection | VizceralNode | null> = new Subject();
  selectedNodeView$: Observable<ConnectionDetailsModel | NodeDetailsModel | null>;
  renderVisceral = true;
  vizceralFilters$: Observable<any>;
  canvasSidesRatio: number;
  
  private objectHighlighted$ = new ReplaySubject<{ type: string, name: string }>(1);
  private destroy$ = new Subject<any>();
  private currentGraphChange$ = new BehaviorSubject<any>(null);
  private vizceralInit$ = new ReplaySubject<boolean>(1);
  private viewUpdated$ = new Subject<void>();

  private flowFilter: FlowFilter;
  private graphIndexName: string | null = null;
  private applicationNodes = new Set<string>();
  private defaultViewNodesSeparated: boolean = false;
 
  constructor(
    private flowDataService: FlowDataService,
    private cdRef: ChangeDetectorRef,
    private appStore: Store<AppState>,
    private rightPaneService: RightPaneService,
    private tabStorageService: TabStorageService<FlowFilter>,
    private hostElement: ElementRef,
  ) {}
  
  ngOnInit(): void {
    this.appStore.dispatch(LoadDataFilter());
    this.selectedNodeView$ = this.appStore.pipe(select(getActiveNode));
    
    this.objectHighlighted$.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged(equal),
    ).subscribe(event => this.rightPaneService.toggleProp('showFlowNode', event || false));
    
    combineLatest([
      this.currentGraphChange$.pipe(distinctUntilChanged((g1, g2) => !!g1 === !!g2)),
      this.tabStorageService.flow<{ showFlowNode: { type: string, name: string } }>('rightPanel').getData(['showFlowNode']),
      this.vizceralInit$.pipe(distinctUntilChanged()),
    ]).pipe(
      filter(([graph]) => !!graph),
      distinctUntilChanged(equal),
      map(([graph, storage]) => {
        const typeKey = storage?.showFlowNode?.type === 'node' ? 'nodes' : 'connections';
        return graph[typeKey]?.[storage?.showFlowNode.name] || null;
      }),
      takeUntil(this.destroy$),
    ).subscribe(trafficNode => {
      this.selectedNode$.next(trafficNode);
      timer(0).subscribe(() => this.vizceralComponent?.vizceral().setHighlightedNode(trafficNode));
    });
  }
  
  ngAfterViewInit(): void {
    this.traffic$ = this.flowDataService.flow();

    this.traffic$.pipe(takeUntil(this.destroy$), pluck('connections'))
      .subscribe(connections => {
        this.flowDataService.startMetadataSubscription({
          connections: JSON.stringify(connections.map(c => ({ target: c.target, source: c.source })))
        })
      })
    
    const init$ = this.vizceralInit$
      .pipe(
        distinctUntilChanged(),
        filter(Boolean),
      );
    
    const setPositions = (positions, graph) => {
      if (!this.vizceralComponent) {
        return timer(0).pipe(switchMap(() => setPositions(positions, graph)));
      }
      Object.keys(graph.nodes).forEach(nodeName => {
        if (positions[nodeName]) {
          this.vizceralComponent.vizceral().moveNodeInteraction._setDraggableObjectPosition(
            graph.nodes[nodeName],
            positions[nodeName].x,
            positions[nodeName].y,
          );
        }
      });
      return of(null);
    };
    
    const reInit$ = this.vizceralInit$.pipe(filter(i => !i));
    combineLatest([
      this.tabStorageService.flow<NodePositions>('node-positions').getData().pipe(delay(100)),
      init$,
    ]).pipe(
      switchMap(data => this.viewUpdated$.pipe(startWith(null), map(() => data), takeUntil(reInit$))),
      filter(([data]) => !!data),
      switchMap(([data]) => this.currentGraphChange$.pipe(filter(g => !!g), map(g => [data, g]))),
      switchMap(([positions, graph]) => setPositions(positions, graph).pipe(map(() => graph))),
      takeUntil(this.destroy$),
    ).subscribe();
    
    init$.pipe(
      switchMap(() => this.currentGraphChange$.pipe(filter(g => !!g), distinctUntilChanged(equal))),
      switchMap(g => interval(300).pipe(map(() => g), takeUntil(reInit$))),
      map(graph => {
        let positions = {};
        this.graphIndexName = graph.graphIndex.length ? graph.graphIndex[0] : null;

        Object.keys(graph.nodes).forEach(nodeName => {
          positions[nodeName] = {...graph.nodes[nodeName].position};

          if (graph.nodes[nodeName].class === 'application' && !this.applicationNodes.has(nodeName)) {
            this.applicationNodes.add(nodeName);
          }
        });

        if (this.graphIndexName && !this.flowDataService[`initialPositions_${this.flowFilter.topology}`][this.graphIndexName]) {
          this.flowDataService[`initialPositions_${this.flowFilter.topology}`][this.graphIndexName] = positions;
        } else if (!this.flowDataService[`initialPositions_${this.flowFilter.topology}`].generalView) {
          this.flowDataService[`initialPositions_${this.flowFilter.topology}`].generalView = positions;
        }

        this.flowFilter.topology === 'ltrTree' ? 
          this.flowDataService.lastTreeTopologyPositions = positions : 
          this.flowDataService.lastStarTopologyPositions = positions;
        
        return this.adjustNodePositions(positions) ?? positions;
      }),
      distinctUntilChanged(equal),
      switchMap(positions => this.updatePositions(positions)),
      takeUntil(this.destroy$),
    ).subscribe();

    combineLatest([
      this.tabStorageService.getData().pipe(filter(f => !!f)),
      init$,
    ]).pipe(
      tap(([{topology}]) => {
        if (this.flowFilter && topology !== this.flowFilter?.topology) {
          topology === 'ltrTree' ? 
            this.reInitVizceral(this.flowDataService.lastTreeTopologyPositions) : 
            this.reInitVizceral(this.flowDataService.lastStarTopologyPositions);
        }
      }),
      map(([{topology, nodes, rpsType, rpsVal}]) => {
        this.flowFilter = {topology, nodes, rpsType, rpsVal};
        return [
          {
            name: 'name',
            type: 'node',
            passes: (node, value: string[]) => !value.length || value.some(name => name === node.name) || this.filterNodeByConnection(node, value),
            value: (nodes || []).map(({id}) => id),
          },
          {
            name: 'rpsFilter',
            type: 'connection',
            passes: (connection: ConnectionDetailsModel, filter: {
              type: 'all' | 'more' | 'less' | 'equal';
              value: number;
            }) => {
              if ([null, undefined].includes(filter.value)) {
                return connection;
              }
              
              switch (filter.type) {
                case 'more':
                  return connection.volumeTotal > filter.value ? connection : null;
                case 'less':
                  return connection.volumeTotal < filter.value ? connection : null;
                case 'equal':
                  return connection.volumeTotal === filter.value ? connection : null;
                default:
                  return connection;
              }
            },
            value: {
              type: rpsType,
              value: rpsVal,
            },
          },
        ];
      }),
      takeUntil(this.destroy$),
    ).subscribe(filters => this.vizceralComponent?.vizceral().setFilters(filters));
    
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
        if (!selectedItem?.type) {
          this.appStore.dispatch(ClearActiveNode());
          return;
        }
        
        const node = selectedItem?.type === 'connection' ?
          new ConnectionDetailsModel(selectedItem, traffic) :
          new NodeDetailsModel(selectedItem, traffic);
        
        this.appStore.dispatch(SetActiveNode({node}));
      });
  }


  private adjustNodePositions(positions: NodePositions) {
    const allNodeNames = Object.keys(positions);

    const nodesOutOfView = {};
    const nodesOverlappedWithGraphIndex = [];
    const nodesAtTheCenter = [];
    const stickyNodes = {};

    const {width, height} = this.hostElement.nativeElement.querySelector('canvas').closest('div').getBoundingClientRect();
    const canvasSidesRatio = width && height ? + (width / height).toFixed(2) : 0;
    
    allNodeNames.forEach(nodeName => {
      // nodes out of view
      nodesOutOfView[nodeName] = {x: false, y: false};
      if (!this.canvasSidesRatio || canvasSidesRatio !== this.canvasSidesRatio) {
        const coordinateY = Math.abs(positions[nodeName].y);
        if (coordinateY >= (nodeName === this.graphIndexName ? 430 : 530) && canvasSidesRatio > this.canvasSidesRatio) {
          nodesOutOfView[nodeName].y = true;
        }
        const coordinateX = Math.abs(positions[nodeName].x);
        if (coordinateX >= (nodeName === this.graphIndexName ? 600 : 700) && canvasSidesRatio < this.canvasSidesRatio) {
          nodesOutOfView[nodeName].x = true;
        }
      }

      // nodes overlapping with index node
      if (this.graphIndexName) {
        const params = {
          positions,
          nodeName,
          targetNodeName: this.graphIndexName,
          targetIsIndexNode: true,
        }
        if (filterNodesWithCloseCoordinate({...params, coordinate: 'x'}) && 
          filterNodesWithCloseCoordinate({...params, coordinate: 'y'}) && nodeName !== this.graphIndexName) {
            nodesOverlappedWithGraphIndex.push(nodeName);
        }
      }

      // nodes at the center (default view)
      if (!this.flowFilter.nodes.length && !this.flowFilter.rpsVal && !this.graphIndexName) {
        if (Math.abs(positions[nodeName].x) < 100 && Math.abs(positions[nodeName].y) < 100) {
          nodesAtTheCenter.push(nodeName);
        }
      }

      // sticky nodes
      const closeNode = Object.keys(stickyNodes).find(targetNodeName => {
        const params = {
          positions,
          nodeName,
          targetNodeName,
        }
        return (filterNodesWithCloseCoordinate({...params, coordinate: 'x'}) && 
              filterNodesWithCloseCoordinate({...params, coordinate: 'y'}));
      })
      if (closeNode) {
        stickyNodes[closeNode] = (!stickyNodes[closeNode] || !stickyNodes[closeNode].length) ? 
          [nodeName] : [...stickyNodes[closeNode], nodeName]
      } else {
        stickyNodes[nodeName] = [];
      }
    })

    if (!Object.keys(nodesOutOfView).length && !nodesOverlappedWithGraphIndex.length && 
      this.defaultViewNodesSeparated && !Object.keys(stickyNodes).length) {
        return null;
    }

    if (!!Object.keys(nodesOutOfView).length) {
      positions = this.setNodesIntoView(nodesOutOfView, positions);
    }

    if (!!nodesOverlappedWithGraphIndex.length) {
      positions = this.fixIndexNodeOverlapping(positions, nodesOverlappedWithGraphIndex);
    }

    if (!this.defaultViewNodesSeparated) {
      positions = this.setDefaultPositions(positions, nodesAtTheCenter);
    } else if (!!Object.keys(stickyNodes).length) {
      positions = this.separateStickyNodes(positions, stickyNodes);
    }

    this.canvasSidesRatio = canvasSidesRatio;
    return positions;
  }

  private setNodesIntoView(nodesOutOfView: NodesOutOfView, positions: NodePositions) {
    let maxX = 700;
    let maxY = 530;
    const step = 30;
    Object.entries(nodesOutOfView).forEach(([nodeName, coords]) => {
      if ((coords as NodeCoordinatesOutOfView).y) {
        if (nodeName === this.graphIndexName) {
          positions[nodeName].y = positions[nodeName].y < 0 ? -400 : 400;
        } else {
          positions[nodeName].y = positions[nodeName].y < 0 ? -maxY : maxY;
        }
      }
      if ((coords as NodeCoordinatesOutOfView).x) {
        if (nodeName === this.graphIndexName) {
          positions[nodeName].x = positions[nodeName].x < 0 ? -600 : 600;
        } else {
          positions[nodeName].x = positions[nodeName].x < 0 ? -maxX : maxX;
        }
      }
    })
    return positions;
  }

  private fixIndexNodeOverlapping(positions: NodePositions, nodesOverlappedWithGraphIndex: string[]) {
    nodesOverlappedWithGraphIndex.forEach(nodeName => {
      positions[nodeName].y >= 0 ? positions[nodeName].y -= 300 : positions[nodeName].y += 300;
      positions[nodeName].x >= 0 ? positions[nodeName].x -= 15 : positions[nodeName].x += 15;
    });
    return positions;
  }

  private setDefaultPositions(positions: NodePositions, nodesAtTheCenter: string[]) {
    if (!nodesAtTheCenter.length) {
      this.defaultViewNodesSeparated = true;
      return positions;
    }

    const allCoordinates = Object.values(positions)
      .map((coords: NodeCoordinates) => ({ x: Math.round(coords.x), y: Math.round(coords.y) }));
      
    if (this.flowFilter.topology === 'ltrTree') {
    
      const centeredNodesYCoords = allCoordinates
        .filter((coords: NodeCoordinates) => coords.x === 0)
        .map((coords: NodeCoordinates) => coords.y);
      const [minY, maxY] = [Math.min(...centeredNodesYCoords), Math.max(...centeredNodesYCoords)];
    
      const step = (maxY - minY) / (nodesAtTheCenter.length + 1);
      let tempY = minY + step;
    
      nodesAtTheCenter.forEach(nodeName => {
        positions[nodeName] = {x: -100, y: tempY};
        tempY += step;
      })
    
      Array.from(this.applicationNodes).forEach(nodeName => positions[nodeName] = {...positions[nodeName], x: 100});
    } else {
      const allXCoords = Object.values(positions).map((coords: NodeCoordinates) => coords.x);
      const allYCoords = Object.values(positions).map((coords: NodeCoordinates) => coords.y);

      let upSideNode: NodeCoordinates,
          downSideNode: NodeCoordinates,
          rightSideNode: NodeCoordinates
    
      upSideNode = allCoordinates.find((coords: NodeCoordinates) => coords.y > 100 && coords.x < 150 && coords.x > -150);
      if (upSideNode) {
        downSideNode = allCoordinates.find((coords: NodeCoordinates) => coords.y < -100 && coords.x < 150 && coords.x > -150);
      }
      if (upSideNode && downSideNode) {
        rightSideNode = allCoordinates.find((coords: NodeCoordinates) => coords.x > 100 && coords.y < 100 && coords.y > -100);
      }
    
      const stepsNumber = nodesAtTheCenter.length - 1;
      let tempX: number, 
          tempY: number, 
          stepX: number, 
          stepY: number
    
      if (!upSideNode) {
        tempY = Math.max(...allYCoords) - 40;
        tempX = 0;
        stepY = (Math.round(tempY) - 100) / stepsNumber;
        stepX = 100 / stepsNumber;
      } else if (!downSideNode) {
        tempY = Math.min(...allYCoords) + 40;
        tempX = 0;
        stepY = (Math.round(tempY) + 100) / stepsNumber;
        stepX = -100 / stepsNumber;
      } else if (!rightSideNode) {
        tempX = Math.max(...allXCoords) - 40;
        tempY = 150;
        stepX = (Math.round(tempX) - 100) / stepsNumber;
        stepY = 300 / stepsNumber;
      } else {
        tempX = Math.min(...allXCoords) + 40;
        tempY = 100;
        stepX = (Math.round(tempX) + 100) / stepsNumber;
        stepY = 300 / stepsNumber;
      }
      nodesAtTheCenter.forEach(nodeName => {
        positions[nodeName] = {x: tempX, y: tempY};
        tempY -= stepY;
        tempX -= stepX;
      })
    }
    this.defaultViewNodesSeparated = true;
    return positions;
  }

  private separateStickyNodes(positions: NodePositions, stickyNodes: {[key: string]: string[]}) {
    Object.entries(stickyNodes).forEach(([targetNode, closeNodes]) => {
      if (!(closeNodes as string[])?.length) {
        return;
      }
      const {x, y} = positions[targetNode]
      const stepX = +x <= 0 ? 40 : -30;
      const stepY = +y <= 0 ? 60 : -50;
      let tempX = +x + stepX;
      let tempY = +y + stepY;

      (closeNodes as string[]).forEach((nodeName: string) => {
        positions[nodeName] = { x: tempX, y: tempY };
        tempX += stepX;
        tempY += stepY;
      })
    })
    return positions;
  }
  
  filterNodeByConnection(node, value: string[]): boolean {
    const CONNECTIONS = [...(node.incomingConnections || []), ...(node.outgoingConnections || [])];
    const result = CONNECTIONS.some(connection => {
      return (connection?.source?.name && value.some(name => name === connection.source.name)) ||
        (connection?.target?.name && value.some(name => name === connection.target.name));
    });
    return result;
  }
  
  objectHighlighted(event: VizceralNode | VizceralConnection | null) {
    this.objectHighlighted$.next(event ? {type: event.type, name: event.name} : null);
  }
  
  viewChanged(event) {
    this.path = event.view;
    const graph: any = event.graph as any;
    if (!!graph) {
      this.currentGraphChange$.next(event.graph);
      graph.setPhysicsOptions({...graph.getPhysicsOptions(), isEnabled: false});
    } else {
      this.currentGraphChange$.next(null);
    }
    this.defaultViewNodesSeparated = false;
  }
  
  breadCrumbClicked(newPath: string[]) {
    this.path = newPath;
    this.vizceralComponent.setView(newPath);
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  onViewUpdated() {
    this.viewUpdated$.next();
    this.vizceralInit$.next(true);
  }

  reInitVizceral(positions = {}, resetLayout = false) {
    this.currentGraphChange$.next(null);
    this.renderVisceral = false;
    this.cdRef.detectChanges();
    this.vizceralInit$.next(false);
    let positionsToUpdate: NodePositions;
    if (resetLayout) {
      positionsToUpdate = this.flowDataService[`initialPositions_${this.flowFilter.topology}`][this.graphIndexName ?? 'generalView'];
      if (!positionsToUpdate) {
        positionsToUpdate = this.flowDataService['initialPositions_ltrTree']['generalView'];
        this.tabStorageService.updateDataSync((data) => ({
          ...data,
          topology: 'ltrTree',
        }))
      }
    } else {
      positionsToUpdate = positions;
    }

    (this.updatePositions(positionsToUpdate)).pipe(
      delay(100),
    ).subscribe(() => {
      this.renderVisceral = true;
      this.cdRef.detectChanges();
    });
  }
  
  private updatePositions(positions: NodePositions): Observable<boolean> {
    return this.tabStorageService.flow('node-positions').updateData(() => positions);
  }
}
