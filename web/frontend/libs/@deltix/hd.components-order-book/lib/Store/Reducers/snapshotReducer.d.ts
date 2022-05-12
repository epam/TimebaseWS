import { L2MessageSide } from '../../l2';
import { snapshotAction } from '../orderBookActions';
import { ISubscriptionParameters, ISubscriptionSide } from '../orderBookState';
export declare const snapshotReducer: (state: ISubscriptionSide, side: L2MessageSide, parameters: ISubscriptionParameters, action: ReturnType<typeof snapshotAction>) => ISubscriptionSide;
