import { createReducer, on }                                            from '@ngrx/store';
import { DataFilterModel }                                              from '../models/dataFilter.model';
import { ConnectionDetailsModel, NodeDetailsModel }                     from '../models/details.model';
import { ShortTrafficNodeModel }                                        from '../models/traffic.node.model';
import { ClearActiveNode, SetActiveNode, SetDataFilter, SetFlowFilter } from './flow.actions';

export const flowFeatureKey = 'flow';

export interface State {
  node: ConnectionDetailsModel | NodeDetailsModel | null;
  filteredNodes: ShortTrafficNodeModel[];
  dataFilter: DataFilterModel;
}

export const initialState: State = {
  node: null,
  filteredNodes: [],
  dataFilter: {
    topologies: [
      {
        type: 'ltrTree',
        isSelected: true,
      },
      {
        type: 'ringCenter',
      },
    ],
  },
};

export const reducer = createReducer(
  initialState,
  on(SetActiveNode, (state, {node}) => ({...state, node})),
  on(ClearActiveNode, (state) => ({...state, node: null})),
  on(SetFlowFilter, (state, {filteredNodes}) => ({...state, filteredNodes})),
  on(SetDataFilter, (state, {dataFilter}) => ({
    ...state,
    dataFilter: dataFilter || initialState.dataFilter,
  })),
);
