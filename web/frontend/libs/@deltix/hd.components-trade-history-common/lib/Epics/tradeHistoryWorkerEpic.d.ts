import { Action } from 'redux';
import { Observable } from 'rxjs';
import { ITrade } from '../common';
export declare const tradeHistoryWorkerEpic: (action$: Observable<Action>) => Observable<{
    type: string;
    payload: {
        trades: ITrade[];
    };
}>;
