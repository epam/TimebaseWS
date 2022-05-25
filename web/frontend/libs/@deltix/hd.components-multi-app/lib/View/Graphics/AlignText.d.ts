import * as PIXI from 'pixi.js';
import * as React from 'react';
import { Container } from '@inlet/react-pixi';
import { IBitmapTextStyle } from '@deltix/hd.components-common';
export declare type TextHorizontalAlign = 'left' | 'right' | 'center';
export declare type TextVerticalAlign = 'top' | 'bottom' | 'middle';
export interface IAlignTextProps {
    text: string;
    style: IBitmapTextStyle;
    vertical: TextVerticalAlign;
    horizontal: TextHorizontalAlign;
    width: number;
    height: number;
    hints?: {
        staticWidth?: boolean;
        monoSpace?: boolean;
    };
    anchor?: number[];
}
export declare const alignHorizontal: (container: PIXI.Container, boxWidth: number, contentWidth: number, align: TextHorizontalAlign) => void;
export declare class AlignText extends React.Component<IAlignTextProps> {
    private textRef;
    private containerRef;
    private fullWidthCached;
    private letterMeasureCached;
    shouldComponentUpdate(nextProps: any, nextState: any): boolean;
    render(): JSX.Element;
    componentDidMount(): void;
    componentDidUpdate(prevProps: Readonly<IAlignTextProps>): void;
    private update;
    private width;
    private getLetterMeasure;
    private computeWidth;
}
