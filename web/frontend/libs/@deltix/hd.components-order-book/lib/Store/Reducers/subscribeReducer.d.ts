import { subscribeAction } from '../orderBookActions';
import { IOrderBookState } from '../orderBookState';
export declare const subscribeReducer: (state: IOrderBookState, action: ReturnType<typeof subscribeAction>) => IOrderBookState;
