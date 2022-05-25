import { L2MessageSide } from '@deltix/hd.components-order-book';
import Big from 'big.js';
import * as React from 'react';
import { IDepthChartSymbol } from '../Store/depthChartState';
import { ELinePosition } from './CrossHair';
interface ILegendProps {
    labelWidth: number;
    labelHeight: number;
    price: Big;
    volume: Big;
    lineColor: number;
    linePosition: ELinePosition;
    symbol: IDepthChartSymbol;
    type: L2MessageSide;
}
export declare const Legend: React.MemoExoticComponent<({ volume, price, symbol: { term, base }, type, labelHeight, labelWidth, }: ILegendProps) => JSX.Element>;
export {};
