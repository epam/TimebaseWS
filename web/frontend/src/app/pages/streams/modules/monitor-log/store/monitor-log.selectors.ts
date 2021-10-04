import { createFeatureSelector }       from '@ngrx/store';
import { monitorLogFeatureKey, State } from './monitor-log.reducer';

export const getMonitorLogState = createFeatureSelector<State>(monitorLogFeatureKey);

// export const getSelectedMessage = createSelector(
//   getMonitorLogState,
//   (state: State) => state.selectedMessage,
// );
