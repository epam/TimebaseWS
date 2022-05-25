import { IOrderBookState, ISpawnedEpicDepth } from '@deltix/hd.components-order-book';
import { Action } from 'redux';
import { StateObservable } from 'redux-observable';
import { Observable } from 'rxjs';
export declare const updateGridEpic: (action$: Observable<Action>, state$: StateObservable<IOrderBookState>, { symbol }: ISpawnedEpicDepth) => Observable<{
    type: string;
}>;
