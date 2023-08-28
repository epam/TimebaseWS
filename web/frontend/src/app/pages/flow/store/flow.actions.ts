import { createAction, props }                      from '@ngrx/store';
import { DataFilterModel }                          from '../models/dataFilter.model';
import { ConnectionDetailsModel, NodeDetailsModel } from '../models/details.model';
import { ShortTrafficNodeModel }                    from '../models/traffic.node.model';

export enum SelectedMessageActionTypes {
  SET_ACTIVE_NODE = '[Flow] Set Active Node',
  CLEAR_ACTIVE_NODE = '[Flow] Clear Active Node',
  
  LOAD_DATA_FILTER = '[Flow] Load Data Filter',
  SET_DATA_FILTER = '[Flow] Set Data Filter',
  SET_ACTIVE_TOPOLOGY_TYPE = '[Flow] Set Active Topology Type',
  
  SET_FLOW_FILTER = '[Flow] Set Filter',
}

export const SetActiveNode = createAction(
  SelectedMessageActionTypes.SET_ACTIVE_NODE,
  props<{ node: ConnectionDetailsModel | NodeDetailsModel }>(),
);
export const LoadDataFilter = createAction(SelectedMessageActionTypes.LOAD_DATA_FILTER);

export const SetDataFilter = createAction(
  SelectedMessageActionTypes.SET_DATA_FILTER,
  props<{ dataFilter: DataFilterModel | null }>(),
);

export const SetActiveTopologyType = createAction(
  SelectedMessageActionTypes.SET_ACTIVE_TOPOLOGY_TYPE,
  props<{ topologyType: string }>(),
);

export const ClearActiveNode = createAction(SelectedMessageActionTypes.CLEAR_ACTIVE_NODE);

export const SetFlowFilter = createAction(
  SelectedMessageActionTypes.SET_FLOW_FILTER,
  props<{filteredNodes: ShortTrafficNodeModel[]}>(),
);
