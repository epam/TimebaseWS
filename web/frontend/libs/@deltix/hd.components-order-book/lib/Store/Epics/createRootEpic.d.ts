import { Epic } from "redux-observable";
export interface IWorkerChannel {
    outActionTypes: string[];
    epic: Epic<any, any>;
    epicType: string;
}
export declare const createRootEpic: (epicChannels: IWorkerChannel[]) => (_: import("redux-observable").ActionsObservable<import("redux").AnyAction>, state$: import("redux-observable").StateObservable<import("../orderBookState").IOrderBookState>) => any;
