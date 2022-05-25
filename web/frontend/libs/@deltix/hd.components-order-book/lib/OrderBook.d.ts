import { Action, AnyAction } from 'redux';
import { ActionsObservable } from 'redux-observable';
import { Observable } from 'rxjs';
import { IOrderBookFeed } from './Feed/IOrderBookFeed';
import { IAppParameters } from './Store/orderBookState';
export declare const orderBookChannel = "orderBook";
export declare type WorkerFactory = () => Worker;
export interface IOrderBook {
    subscribe(symbol: string, parameters: object, channel: string, epicType: string, appId: string): Observable<Action>;
    sendActionToOrderBookWorker(data: AnyAction): void;
    sendActionToOrderBookWorker(channel: string, data: AnyAction): void;
}
export declare const serializer: (value: any) => string;
export declare class OrderBook implements IOrderBook {
    private webSocketFeed;
    private worker;
    private webWorker;
    private workerStream;
    private feedSubscriptions;
    constructor(webSocketFeed: IOrderBookFeed, worker: string);
    constructor(webSocketFeed: IOrderBookFeed, worker: WorkerFactory);
    subscribe(symbol: string, parameters: IAppParameters, channel: string, epicType: string, appId: string): ActionsObservable<AnyAction>;
    sendActionToOrderBookWorker(data: AnyAction): void;
    sendActionToOrderBookWorker(channel: string, data: AnyAction): void;
    private runWorker;
    private stopWorker;
}
