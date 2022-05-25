import * as React from 'react';
import { EGradientDirection } from '@deltix/hd.components-utils';
export interface IGradientProps {
    width: number;
    height: number;
    direction: EGradientDirection;
    colors: [number, string][];
    mask?: any;
}
export declare class Gradient extends React.Component<IGradientProps> {
    private ref;
    private canvas;
    private ctx;
    private sprite;
    render(): JSX.Element;
    componentDidMount(): void;
    componentDidUpdate(): void;
    private renderCanvas;
}
