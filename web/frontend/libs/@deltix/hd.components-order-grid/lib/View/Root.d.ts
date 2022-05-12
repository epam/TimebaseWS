import Big from 'big.js';
import * as React from 'react';
import { IGridData } from '../Store/orderGridState';
interface IRootProps {
    height: number;
    width: number;
    x: number;
    y: number;
    buy: IGridData;
    sell: IGridData;
    spread: Big;
    quantityPrecision: number;
    pricePrecision: number;
    dispatch: any;
    termCode: string;
    showExchange: boolean;
    showUserQuantity: boolean;
    splitView: boolean;
    abbreviations: boolean;
}
interface IRootState {
    hintText: string;
    hintX: number;
    hintY: number;
    hintWidth: number;
    hintHeight: number;
}
declare class Root extends React.Component<IRootProps, IRootState> {
    private spreadContainer;
    private currentScroll;
    private symbolWidth;
    componentDidMount(): void;
    componentDidUpdate({ height }: IRootProps): void;
    render(): JSX.Element;
    private computeScroll;
    private hideHint;
    private showHint;
}
export declare const ConnectedRoot: import("react-redux").ConnectedComponent<typeof Root, import("react-redux").Omit<React.ClassAttributes<Root> & IRootProps, "height" | "width" | "x" | "y" | "buy" | "sell" | "spread" | "quantityPrecision" | "pricePrecision" | "dispatch" | "termCode" | "showExchange" | "showUserQuantity" | "splitView" | "abbreviations">>;
export {};
