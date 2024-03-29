import { IFormat } from '@deltix/hd.components-common';
import { ELineType, L2MessageSide } from '@deltix/hd.components-order-book';
import Big from 'big.js';
import * as React from 'react';
import { IHighlightOrders, IUserOrdersMap } from '../Store/orderGridState';
interface IOrderLineProps {
    formatPrice: IFormat;
    formatQuantity: IFormat;
    id: string;
    price: Big;
    worstPrice: Big;
    pricePrecision: number;
    cumulativeQuantity: Big;
    quantity: Big;
    quantityPrecision: number;
    userOrdersMap: IUserOrdersMap;
    showCumulativeQuantity: boolean;
    showUserQuantity: boolean;
    aggregatingQuantity: boolean;
    width: number;
    height: number;
    color: number;
    onSelect: (price: Big, quantity: Big, exchange: string | undefined, type: ELineType) => any;
    onHover: (price: Big) => any;
    highlightOrders: IHighlightOrders;
    deleted: string[];
    exchange: string | undefined;
    showExchange: boolean;
    side: L2MessageSide;
    abbreviations: boolean;
    index: number;
    showHint: (hintText: string, hintX: number, hintY: number, hintWidth: number, hintHeight: number) => any;
    hideHint: () => any;
}
interface IOrderLineState {
    hovered: boolean;
    grow: boolean;
    id: string;
    price: Big;
    worstPrice: Big;
    cumulativeQuantity: Big;
    quantity: Big;
    next: {
        price: Big;
        quantity: Big;
    } | undefined;
    hintText?: string;
    hintContainerX?: number;
    hintY?: number;
    hintWidth?: number;
    hintHeight?: number;
}
declare class OrderLineComp extends React.Component<IOrderLineProps, IOrderLineState> {
    static getDerivedStateFromProps(nextProps: IOrderLineProps, prevState: IOrderLineState): IOrderLineState | {
        grow: boolean;
        next: {
            id: string;
            price: Big;
            quantity: Big;
            cumulativeQuantity: Big;
            worstPrice: Big;
        };
        hovered: boolean;
        id: string;
        price: Big;
        worstPrice: Big;
        cumulativeQuantity: Big;
        quantity: Big;
        hintText?: string;
        hintContainerX?: number;
        hintY?: number;
        hintWidth?: number;
        hintHeight?: number;
    };
    state: IOrderLineState;
    private orderLineHitArea;
    private cumulativeQuantityHitArea;
    private marketQuantityHitArea;
    private priceHitArea;
    private exchangeHitArea;
    private worstPriceHitArea;
    private hideTween;
    private growTween;
    private growRef;
    private rootRef;
    shouldComponentUpdate(props: IOrderLineProps, state: IOrderLineState): boolean;
    render(): JSX.Element;
    componentDidUpdate(): void;
    private getBlockSizes;
    private renderMyQuantity;
    private onSelectedExchange;
    private onSelectedPrice;
    private onSelectedQuantity;
    private onSelectedWorstPrice;
    private toggleHover;
    private showHint;
    private qtyContainerWidth;
    private hideHint;
    private containsPoint;
}
export declare const OrderLine: import("react-redux").ConnectedComponent<typeof OrderLineComp, import("react-redux").Omit<React.ClassAttributes<OrderLineComp> & IOrderLineProps, "formatPrice" | "formatQuantity" | "userOrdersMap" | "showCumulativeQuantity" | "showUserQuantity" | "aggregatingQuantity" | "highlightOrders" | "showExchange">>;
export {};
