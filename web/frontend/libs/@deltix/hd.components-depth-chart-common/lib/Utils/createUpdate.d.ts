import { IEqualPriceRecord } from '@deltix/hd.components-order-book';
import Big from 'big.js';
import { IPricesIntegral } from '../common';
export declare const createUpdate: (buy: IEqualPriceRecord[], sell: IEqualPriceRecord[], zoom: number) => {
    buyPrices: IPricesIntegral[];
    sellPrices: IPricesIntegral[];
    midPrice: Big;
};
