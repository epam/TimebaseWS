import { L2MessageSide } from '../../l2';
import { deleteOrderFromAction } from '../orderBookActions';
import { ISubscriptionParameters, ISubscriptionSide } from '../orderBookState';
/**
 * Delete all ILevelRecords from level 'x' to maximum level
 *
 * EXAMPLE: book(sell 4 levels): [45, 47, 48, 79, 100] deleteFrom(1) -> expected value [45]
 */
export declare const deleteOrderFromReducer: (state: ISubscriptionSide, side: L2MessageSide, parameters: ISubscriptionParameters, action: ReturnType<typeof deleteOrderFromAction>) => ISubscriptionSide;
