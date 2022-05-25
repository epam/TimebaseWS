import { L2MessageSide } from '../../l2';
import { IEqualPriceRecord, ISubscriptionSide } from '../orderBookState';
/**
 * 1) Calculate aggregatedPrice
 * 2) Find IAggregatedPriceRecord
 * 3) Remove IPriceRecord from IAggPriceRecord::records
 * 4) IF IAggregatedPriceRecord::records now empty:
 *      1) Push IAggPriceRecord::price to aggregated::deleted
 *      2) Remove IAggPriceRecord from aggregated::records
 *    ELSE
 *      Update IAggPriceRecord::quantity
 */
export declare const deleteEqualPriceRecord: (subscriptionSide: ISubscriptionSide, side: L2MessageSide, equalPriceRecord: IEqualPriceRecord, groupingPrice: number) => void;
