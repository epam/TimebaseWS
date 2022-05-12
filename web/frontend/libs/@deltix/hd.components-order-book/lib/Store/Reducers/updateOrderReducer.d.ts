import { L2MessageSide } from '../../l2';
import { updateOrderAction } from '../orderBookActions';
import { ISubscriptionParameters, ISubscriptionSide } from '../orderBookState';
/**
 * 1) Get old ILevelRecord from side::levels::[ILevelRecord::exchange][ILevelRecord::level]
 * 2) Get IPriceRecord from old ILevelRecord::equalPriceRecord
 * 3) Update IPriceRecord quantity
 * 4) Replace old ILevelRecord to new ILevelRecord in IPriceRecord::levels
 */
export declare const updateOrderReducer: (state: ISubscriptionSide, side: L2MessageSide, parameters: ISubscriptionParameters, action: ReturnType<typeof updateOrderAction>) => ISubscriptionSide;
