import { L2MessageSide } from '../../l2';
import { IOrderBookAction } from '../orderBookActions';
import { IOrderBookState, ISubscriptionParameters, ISubscriptionSide } from '../orderBookState';
export declare type SideReducer = (state: ISubscriptionSide, side: L2MessageSide, parameters: ISubscriptionParameters, action: IOrderBookAction) => ISubscriptionSide;
export declare const HOCReducer: (reducer: SideReducer) => (state: IOrderBookState, action: IOrderBookAction) => IOrderBookState;
