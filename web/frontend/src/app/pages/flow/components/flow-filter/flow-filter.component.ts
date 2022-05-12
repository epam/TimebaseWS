import { Component, OnDestroy, OnInit }                 from '@angular/core';
import { FormBuilder, FormGroup }                       from '@angular/forms';
import { select, Store }                                from '@ngrx/store';
import equal                                            from 'fast-deep-equal';
import { IDropdownSettings }                            from 'ng-multiselect-dropdown/multiselect.model';
import { Observable, Subject }                          from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import { AppState }                                     from '../../../../core/store';
import { TopologyTypeModel }                            from '../../models/topologyType.model';
import { TrafficModel }                                 from '../../models/traffic.model';
import { ShortTrafficNodeModel }                        from '../../models/traffic.node.model';
import { FlowDataService }                              from '../../services/flow-data.service';
import { SetActiveTopologyType, SetFlowFilter }         from '../../store/flow.actions';
import { getActiveTopology, getTopologies }             from '../../store/flow.selectors';

@Component({
  selector: 'app-flow-filter',
  templateUrl: './flow-filter.component.html',
  styleUrls: ['./flow-filter.component.scss'],
})
export class FlowFilterComponent implements OnInit, OnDestroy {
  public nodesList$: Observable<ShortTrafficNodeModel[]>;
  public topologies$: Observable<TopologyTypeModel[]>;
  public dropdownSettings: IDropdownSettings = {
    idField: 'name',
    textField: 'name',
    allowSearchFilter: true,
    // enableCheckAll: false,
    closeDropDownOnSelection: false,
    itemsShowLimit: 10,
  };
  public selectedNodes: ShortTrafficNodeModel[] = [];
  public dataFilterForm: FormGroup;

  private destroy$ = new Subject<any>();

  constructor(
    private flowDataService: FlowDataService,
    private appStore: Store<AppState>,
    private fb: FormBuilder,
  ) {}

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.appStore
      .pipe(
        select(getActiveTopology),
        filter(Boolean),
        filter((activeTopology: TopologyTypeModel) => {
          const CURRENT_TYPE = this.dataFilterForm?.get('topologyType').value;
          return CURRENT_TYPE !== activeTopology?.type;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((activeTopology) => {
        if (this.dataFilterForm) {
          this.dataFilterForm.get('topologyType').setValue(activeTopology.type);
        } else {
          this.dataFilterForm = this.fb.group({
            topologyType: [activeTopology.type],
          });
        }
      });
    this.nodesList$ = this.flowDataService.getFlowDataLink$().pipe(
      map((flow: TrafficModel) => {
        return flow?.nodes?.map((node) => new ShortTrafficNodeModel(node)) || [];
      }),
      distinctUntilChanged(equal),
      takeUntil(this.destroy$),
    );
    this.topologies$ = this.appStore.pipe(select(getTopologies));
  }

  public onSelectedNodesChanged(filteredNodes: ShortTrafficNodeModel[]) {
    this.appStore.dispatch(SetFlowFilter({filteredNodes}));
  }

  public onTopologySelect() {
    const topologyType = this.dataFilterForm.get('topologyType').value;
    if (topologyType) {
      this.appStore.dispatch(SetActiveTopologyType({topologyType}));
    }
  }

  public topologiesTrackBy(idx, topology) {
    return topology.type;
  }
}
