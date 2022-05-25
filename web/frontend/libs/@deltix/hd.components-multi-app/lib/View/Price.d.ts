import { IFormat, TextStyle } from '@deltix/hd.components-common';
import Big from 'big.js';
import * as React from 'react';
import { TextHorizontalAlign } from './Graphics/AlignText';
export interface IPriceProps {
    price: Big;
    formatPrice: IFormat;
    width: number;
    height: number;
    decimalPart: number;
    style: TextStyle;
    limitPrecision?: boolean;
    align?: TextHorizontalAlign;
}
export declare class Price extends React.Component<IPriceProps> {
    static defaultProps: {
        limitPrecision: boolean;
    };
    private symbolWidth;
    render(): JSX.Element;
}
