import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DataFilterModel }                       from '../models/dataFilter.model';
import { TopologyTypeModel }                     from '../models/topologyType.model';
import { flowFeatureKey, State }                 from './flow.reducer';

export const getFlowState = createFeatureSelector<State>(flowFeatureKey);

export const getActiveNode = createSelector(getFlowState, (state: State) => state.node);

export const getFilteredNodes = createSelector(getFlowState, (state: State) => state.filteredNodes);

export const getDataFilter = createSelector(getFlowState, (state: State) => state.dataFilter);

export const getTopologies = createSelector(
  getDataFilter,
  (dataFilter: DataFilterModel) => dataFilter?.topologies,
);

export const getActiveTopology = createSelector(getTopologies, (topologies: TopologyTypeModel[]) =>
  topologies?.find((topology) => topology.isSelected),
);
