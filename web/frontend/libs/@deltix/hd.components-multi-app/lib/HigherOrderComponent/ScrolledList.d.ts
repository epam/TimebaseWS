import * as React from 'react';
export declare type ComputeScroll = (direction: -1 | 1, currentScroll: number, height: number) => number;
export interface IScrolledListProps {
    height: number;
    width: number;
    x: number;
    y: number;
    computeScroll?: ComputeScroll;
}
interface IScrolledListState {
    mouseOnList: boolean;
    touchY: number;
}
export declare class ScrolledList extends React.Component<IScrolledListProps, IScrolledListState> {
    state: IScrolledListState;
    private ref;
    private view;
    private hitArea;
    constructor(p: any, c: any);
    render(): JSX.Element;
    componentWillUnmount(): void;
    private setListener;
    private computeScroll;
    private onPointerOver;
    private onPointerOut;
    private onWheel;
    private updateScroll;
    private onTouch;
}
export {};
