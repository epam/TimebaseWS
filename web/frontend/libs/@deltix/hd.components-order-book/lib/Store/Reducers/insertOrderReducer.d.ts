import { L2MessageSide } from '../../l2';
import { insertOrderAction } from '../orderBookActions';
import { ISubscriptionParameters, ISubscriptionSide } from '../orderBookState';
/**
 * 1) Find IPriceRecord in IOrderBookSide::aggregated
 *    IF found
 *      1) Update IPriceRecord::quantity
 *      2) Push ILevelRecord to IPriceRecord::levels
 *      2) Link ILevelRecord::equalPriceRecord to IPriceRecord
 *    ELSE
 *      1) Create new IPriceRecord
 *      2) Insert IPriceRecord to IOrderBookSide::aggregated
 * 2) Insert ILevelRecord to IOrderBookSide::levels::[symbol] according ILevelRecord::level
 */
export declare const insertOrderReducer: (state: ISubscriptionSide, side: L2MessageSide, parameters: ISubscriptionParameters, action: ReturnType<typeof insertOrderAction>) => ISubscriptionSide;
