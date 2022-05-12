import { Store } from 'redux';
import { IWorkerChannel } from './Epics/createRootEpic';
import { IOrderBookState } from './orderBookState';
export declare const createOrderBookStore: (epicChannels: IWorkerChannel[]) => Store<IOrderBookState>;
