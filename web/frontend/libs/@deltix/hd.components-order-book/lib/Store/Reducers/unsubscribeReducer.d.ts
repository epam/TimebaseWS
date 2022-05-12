import { unsubscribeAction } from "../orderBookActions";
import { IOrderBookState } from "../orderBookState";
/**
 * Remove subscriptions::symbol
 */
export declare const unsubscribeReducer: (state: IOrderBookState, action: ReturnType<typeof unsubscribeAction>) => IOrderBookState;
