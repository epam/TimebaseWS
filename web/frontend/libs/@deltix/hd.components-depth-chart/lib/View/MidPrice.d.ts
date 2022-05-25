import * as React from 'react';
interface IMidPriceProps {
    renderLine: boolean;
    xMidPrice: number;
    xMidPriceLabel?: number;
}
export declare const MidPrice: React.MemoExoticComponent<({ renderLine, xMidPrice, xMidPriceLabel }: IMidPriceProps) => JSX.Element>;
export {};
