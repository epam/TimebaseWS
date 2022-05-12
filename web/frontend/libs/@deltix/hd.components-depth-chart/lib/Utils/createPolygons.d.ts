import { EOrientations, IPricesIntegral } from '@deltix/hd.components-depth-chart-common';
import Big from 'big.js';
export declare const createPolygons: (buyPrices: IPricesIntegral[], sellPrices: IPricesIntegral[], middlePrice: Big, chartHeight: number, chartWidth: number, orientation: EOrientations) => {
    buyPolygon: any[];
    sellPolygon: any[];
    ticks: any[];
    xMidPrice: Big;
    maxQuantity: Big;
    xOriginalMidPrice?: undefined;
} | {
    buyPolygon: number[];
    sellPolygon: number[];
    ticks: ({
        label: number;
        x: any;
    } | {
        label: Big;
        x: Big;
    })[];
    xMidPrice: Big;
    maxQuantity: Big;
    xOriginalMidPrice: number;
};
