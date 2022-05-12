import { IOrderBookAction } from '../orderBookActions';
import { IOrderBookState } from '../orderBookState';
export declare const validatedReducer: (wrapped: any) => (state: IOrderBookState, action: IOrderBookAction) => IOrderBookState;
