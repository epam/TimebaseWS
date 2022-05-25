import { L2MessageSide } from '@deltix/hd.components-order-book';
import Big from 'big.js';
import { IDepthChartParameters, IPricesIntegral } from './common';
export declare const updateDepthChartAction: (buy: IPricesIntegral[], sell: IPricesIntegral[], middlePrice: Big) => {
    type: string;
    payload: {
        buy: IPricesIntegral[];
        sell: IPricesIntegral[];
        middlePrice: Big;
    };
};
export declare const depthChartZoomAction: (zoom: number) => {
    type: string;
    payload: {
        zoom: number;
    };
};
export declare const highlightPriceAction: (groupId: string, side: L2MessageSide, entity: any) => {
    type: string;
    payload: {
        groupId: string;
        side: L2MessageSide;
        entity: any;
    };
};
export declare const noPriceToHighlightAction: (groupId: string) => {
    type: string;
    payload: {
        groupId: string;
    };
};
/**
 * API
 */
export declare const updateParametersAction: (parameters: IDepthChartParameters) => {
    type: string;
    payload: {
        parameters: IDepthChartParameters;
    };
};
