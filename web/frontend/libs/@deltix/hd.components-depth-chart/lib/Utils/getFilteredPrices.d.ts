import { EOrientations, IPricesIntegral } from '@deltix/hd.components-depth-chart-common';
import Big from 'big.js';
export declare const getFilteredPrices: (buyPrices: IPricesIntegral[], sellPrices: IPricesIntegral[], orientation: EOrientations) => [IPricesIntegral[], IPricesIntegral[], Big];
