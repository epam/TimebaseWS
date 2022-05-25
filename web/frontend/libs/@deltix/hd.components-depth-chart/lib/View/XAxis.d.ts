import * as React from 'react';
interface IXAxisTick {
    x: number;
    label: string;
}
interface IXAxisProps {
    ticks: IXAxisTick[];
    width: number;
    color: number;
    decimalPart: number;
}
export declare const XAxis: React.MemoExoticComponent<({ ticks, color, width, decimalPart }: IXAxisProps) => JSX.Element>;
export {};
