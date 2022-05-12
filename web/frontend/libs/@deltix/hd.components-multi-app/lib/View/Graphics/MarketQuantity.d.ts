import { IFormat, TextStyle } from '@deltix/hd.components-common';
import { Big } from 'big.js';
import * as React from 'react';
import { TextHorizontalAlign } from './AlignText';
export interface IMarketQuantityProps {
    quantity: Big;
    formatQuantity: IFormat;
    width: number;
    height: number;
    precision: number;
    limitPrecision?: boolean;
    ceilPartStyle: TextStyle;
    decimalPartStyle: TextStyle;
    zeroPartStyle: TextStyle;
    align?: TextHorizontalAlign;
    abbreviations: boolean;
}
export declare class MarketQuantity extends React.Component<IMarketQuantityProps> {
    static defaultProps: {
        limitPrecision: boolean;
    };
    state: {
        grow: any;
    };
    private symbolWidth;
    shouldComponentUpdate(nextProps: any, nextState: any): boolean;
    render(): JSX.Element;
    private split;
}
