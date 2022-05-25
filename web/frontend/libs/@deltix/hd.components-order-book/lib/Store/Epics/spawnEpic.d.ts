import { AnyAction } from 'redux';
import { ActionsObservable, StateObservable } from 'redux-observable';
import { IOrderBookState } from '../orderBookState';
import { IWorkerChannel } from './createRootEpic';
export interface ISpawnedEpicDepth {
    symbol: string;
}
export declare const spawnEpic: (action$: ActionsObservable<AnyAction>, state$: StateObservable<IOrderBookState>, { epic, outActionTypes }: IWorkerChannel, channelForSpawn: string, symbol: string, parameters: object) => import("rxjs").Observable<any>;
