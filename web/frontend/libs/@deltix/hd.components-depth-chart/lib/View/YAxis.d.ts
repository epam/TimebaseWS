import * as React from 'react';
interface IYAxisProps {
    range: [number, number];
    height: number;
    width: number;
    color: number;
}
export declare const YAxis: React.MemoExoticComponent<({ range: [from, to], height, width, color }: IYAxisProps) => JSX.Element>;
export {};
