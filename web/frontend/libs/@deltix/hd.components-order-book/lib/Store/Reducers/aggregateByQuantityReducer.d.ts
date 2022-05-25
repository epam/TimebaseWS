import { aggregateByQuantityAction } from '../orderBookActions';
import { IOrderBookState } from '../orderBookState';
export declare const aggregateByQuantityReducer: (state: IOrderBookState, action: ReturnType<typeof aggregateByQuantityAction>) => IOrderBookState;
