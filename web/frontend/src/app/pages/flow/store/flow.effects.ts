import { Injectable }                                           from '@angular/core';
import { Actions, createEffect, ofType }                        from '@ngrx/effects';
import { select, Store }                                        from '@ngrx/store';
import { map, switchMap, tap, withLatestFrom }                  from 'rxjs/operators';
import { AppState }                                             from '../../../core/store';
import { DataFilterModel }                                      from '../models/dataFilter.model';
import { LoadDataFilter, SetActiveTopologyType, SetDataFilter } from './flow.actions';
import { getDataFilter }                                        from './flow.selectors';

const FLOW_DATA_FILTER_LS_KEY = 'fdfk';

@Injectable()
export class FlowEffects {
  setActiveTopology$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SetActiveTopologyType),
      map((action) => action.topologyType),
      withLatestFrom(this.appStore.pipe(select(getDataFilter))),
      map(([topologyType, dataFilter]) => {
        const topologies = dataFilter.topologies.map((topology) => ({
          ...topology,
          isSelected: topologyType === topology.type,
        }));
        return SetDataFilter({
          dataFilter: {
            ...(dataFilter || {
              rpsFilter: null,
            }),
            topologies,
          },
        });
      }),
    ),
  );
  
  saveDataFilter$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SetDataFilter),
        switchMap(() => this.appStore.pipe(select(getDataFilter))),
        tap((dataFilter) => {
          if (dataFilter) {
            localStorage.setItem(FLOW_DATA_FILTER_LS_KEY, JSON.stringify(dataFilter));
          }
        }),
      ),
    {
      dispatch: false,
    },
  );
  
  loadDataFilter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoadDataFilter),
      map(() => localStorage.getItem(FLOW_DATA_FILTER_LS_KEY)),
      map((dataFilterState: string) => {
        let dataFilter: DataFilterModel;
        try {
          dataFilter = dataFilterState ? JSON.parse(dataFilterState) : null;
          dataFilter.rpsFilter = null;
        } catch (e) {
          dataFilter = null;
        }
        return SetDataFilter({dataFilter});
      }),
    ),
  );
  
  constructor(private actions$: Actions, private appStore: Store<AppState>) {}
}
