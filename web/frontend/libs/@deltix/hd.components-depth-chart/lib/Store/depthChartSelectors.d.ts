import { L2MessageSide } from '@deltix/hd.components-order-book';
import Big from 'big.js';
import { IDepthChartState, IFormatFunctions } from './depthChartState';
export declare const findClosestIndex: <T>(num: Big, arr: T[], select: (v: T) => Big, reversed: boolean) => number;
export declare const priceInSpread: (state: IDepthChartState, price: Big) => boolean;
export declare const getPriceByX: (state: IDepthChartState) => [Big, L2MessageSide];
export declare const getXByPrice: (state: IDepthChartState, price: Big, side: L2MessageSide) => number | undefined;
export declare const getQuantityByPrice: (state: IDepthChartState, price: Big, dataSet: L2MessageSide) => Big;
export declare const getYByPrice: (state: IDepthChartState, price: Big, dataSet: L2MessageSide) => number;
export declare const highlightPricesSelector: (state: IDepthChartState) => {
    sell: {
        pointX: number;
        pointY: number;
    };
    buy: {
        pointX: number;
        pointY: number;
    };
};
export declare const formatFunctionsSelector: (state: IDepthChartState) => IFormatFunctions;
