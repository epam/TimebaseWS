import { EGradientDirection } from '@deltix/hd.components-utils';
import * as React from 'react';
export interface IBackgroundProps {
    width: number;
    height: number;
    color?: number;
    alpha?: number;
    image?: string;
    gradient?: {
        direction: EGradientDirection;
        colors: [number, string][];
    };
}
export declare class Background extends React.Component<IBackgroundProps> {
    render(): JSX.Element;
    renderImage(): JSX.Element;
}
