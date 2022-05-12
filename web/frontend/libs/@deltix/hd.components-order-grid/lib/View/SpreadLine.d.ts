import Big from 'big.js';
import * as React from 'react';
interface ISpreadLineProps {
    height: number;
    width: number;
    code: string;
    spread: Big;
    spreadPrecision: number;
    padding: number;
    showExchangeId: boolean;
    showUserQuantity: boolean;
}
export declare const SpreadLine: React.MemoExoticComponent<({ height, spread, code, width, padding, showUserQuantity, showExchangeId, spreadPrecision, }: ISpreadLineProps) => JSX.Element>;
export {};
