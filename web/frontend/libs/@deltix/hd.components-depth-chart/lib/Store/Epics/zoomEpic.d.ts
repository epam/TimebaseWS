import { IOrderBook } from '@deltix/hd.components-order-book';
import { AnyAction } from 'redux';
import { ActionsObservable } from 'redux-observable';
export declare const zoomEpic: (orderBook: IOrderBook, channel: string, smoothness: number) => (action$: ActionsObservable<AnyAction>) => import("rxjs").Observable<never>;
