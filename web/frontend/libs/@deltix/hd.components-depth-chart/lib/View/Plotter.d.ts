import * as React from 'react';
interface IPlotterProps {
    polygon: number[];
    line: {
        color: number;
        alpha: number;
        shadow: {
            blur: number;
            distance: number;
            rotation: number;
            color: number;
            alpha: number;
        }[];
    };
    area: {
        color: number;
        alpha: number;
    };
    height: number;
    lineWidth: number;
}
export declare class Plotter extends React.Component<IPlotterProps> {
    private lineRef;
    private areaRef;
    componentDidUpdate(): void;
    componentDidMount(): void;
    render(): JSX.Element[];
    private update;
    private closeArea;
}
export {};
