import Big from 'big.js';
import { L2MessageSide } from '../../l2';
import { IEqualPriceRecord, ISubscriptionSide } from '../orderBookState';
/**
 * 1) Calculate aggregationPrice
 * 2) Find IAggPriceRecord
 * 3) Update IAggPriceRecord quantity
 */
export declare const updateEqualPriceRecord: (subscriptionSide: ISubscriptionSide, side: L2MessageSide, equalPriceRecord: IEqualPriceRecord, newQuantity: Big, groupingPrice: number) => void;
