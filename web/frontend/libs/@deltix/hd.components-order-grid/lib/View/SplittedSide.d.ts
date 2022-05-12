import { L2MessageSide } from '@deltix/hd.components-order-book';
import * as React from 'react';
interface ISplittedProps {
    height: number;
    scrollPosition: number;
    side: L2MessageSide;
    lineWidth: number;
    quantityPrecision: number;
    pricePrecision: number;
    countLines: number;
    sideHeight: number;
    lineHeight: number;
    abbreviations: boolean;
    showHint: (hintText: string, hintX: number, hintY: number, hintWidth: number, hintHeight: number, side: L2MessageSide) => any;
    hideHint: () => any;
}
export declare const SplittedSide: React.NamedExoticComponent<ISplittedProps>;
export {};
