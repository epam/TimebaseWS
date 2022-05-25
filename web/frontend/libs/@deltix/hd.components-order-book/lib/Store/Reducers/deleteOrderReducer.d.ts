import { L2MessageSide } from '../../l2';
import { deleteOrderAction } from '../orderBookActions';
import { ISubscriptionParameters, ISubscriptionSide } from '../orderBookState';
/**
 * 1) Get by level in IOrderBookSide::levels::["code"]
 *
 * 2) Get IPriceRecord by ref
 *  IF IPriceRecord contains only one level (current) remove IPriceRecord,
 *  ELSE remove current ILevelRecord from IPriceRecord::levels and update IPriceRecord::price
 */
export declare const deleteOrderReducer: (state: ISubscriptionSide, side: L2MessageSide, parameters: ISubscriptionParameters, action: ReturnType<typeof deleteOrderAction>) => ISubscriptionSide;
