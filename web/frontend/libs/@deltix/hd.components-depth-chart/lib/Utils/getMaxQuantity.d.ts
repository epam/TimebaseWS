import { EOrientations, IPricesIntegral } from '@deltix/hd.components-depth-chart-common';
import Big from 'big.js';
export declare const getMaxQuantity: (buyPrices: IPricesIntegral[], sellPrices: IPricesIntegral[], orientation: EOrientations) => Big;
