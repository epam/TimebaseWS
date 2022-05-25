import { AnyAction } from "redux";
import { ActionsObservable, StateObservable } from "redux-observable";
import { IOrderBookState } from "../orderBookState";
import { IWorkerChannel } from "./createRootEpic";
export declare const createChanelAction: (channel: string, action: AnyAction) => {
    channel: string;
    action: AnyAction;
};
export declare const workerRouterEpic: (epicChannels: IWorkerChannel[]) => (action$: ActionsObservable<AnyAction>, state$: StateObservable<IOrderBookState>) => import("rxjs").Observable<any>;
