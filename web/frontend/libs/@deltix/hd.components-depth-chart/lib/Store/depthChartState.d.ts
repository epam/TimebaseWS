import { IFormat } from '@deltix/hd.components-common';
import { IDepthChartParameters, IPricesIntegral } from '@deltix/hd.components-depth-chart-common';
import { IInputState, IViewportState } from '@deltix/hd.components-multi-app';
import { L2MessageSide } from '@deltix/hd.components-order-book';
import Big from 'big.js';
export interface IDepthChardReducerParameters {
    symbol: IDepthChartSymbol;
    formatFunctions: IFormatFunctions;
    parameters: IDepthChartParameters;
}
export interface ICurrency {
    code: string;
    icon: string;
    decimalPart: number;
}
export interface IDepthChartSymbol {
    symbol: string;
    base: ICurrency;
    term: ICurrency;
}
export interface IDepthChartState {
    app: IDepthChartAppState;
    input: IInputState;
    viewport: IViewportState;
}
export interface IHighlightPrices {
    mainSide: L2MessageSide;
    buy: Big;
    sell: Big;
}
export interface IPrices {
    sell: IPricesIntegral[];
    buy: IPricesIntegral[];
}
export interface IFormatFunctions {
    yAxis: IFormat;
    xAxis: IFormat;
    price: IFormat;
    volume: IFormat;
}
export interface IDepthChartAppState {
    formatFunctions: IFormatFunctions;
    parameters: IDepthChartParameters;
    symbol: IDepthChartSymbol;
    middlePrice: Big;
    prices: IPrices;
    highlightPrices: IHighlightPrices;
}
