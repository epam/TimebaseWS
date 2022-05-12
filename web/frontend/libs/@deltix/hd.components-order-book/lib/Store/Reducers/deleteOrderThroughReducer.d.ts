import { L2MessageSide } from '../../l2';
import { deleteOrderThroughAction } from '../orderBookActions';
import { ISubscriptionParameters, ISubscriptionSide } from '../orderBookState';
/**
 * Delete all ILevelRecord from level 0 to level 'x'
 *
 * EXAMPLE: book(sell 4 levels): [45, 47, 48, 79, 100] deleteThru(3) -> expected value [100]
 */
export declare const deleteOrderThroughReducer: (state: ISubscriptionSide, side: L2MessageSide, parameters: ISubscriptionParameters, action: ReturnType<typeof deleteOrderThroughAction>) => ISubscriptionSide;
