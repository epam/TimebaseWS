import { L2MessageSide } from '../../l2';
import { IEqualPriceRecord, ISubscriptionSide } from '../orderBookState';
/**
 * 1) Calculate aggregationPrice
 * 2) IF not aggregating by aggregation value:
 *      initialize
 * 3) Remove aggregationPrice from aggregated::deleted
 * 4) Find IAggPriceRecord
 * 5) IF found
 *      1) Update IAggPriceRecord quantity
 *      2) Push IPriceRecord to IAggPriceRecord::equalPriceRecords
 *    ELSE
 *      1) Create IAggPriceRecord
 *      2) Insert IAggPriceRecord to aggregated::records
 */
export declare const insertEqualPriceRecord: (subscriptionSide: ISubscriptionSide, side: L2MessageSide, equalPriceRecord: IEqualPriceRecord, aggregationValue: number) => void;
