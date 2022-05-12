import * as PIXI from 'pixi.js';
import * as React from 'react';
import { TextHorizontalAlign } from './Graphics/AlignText';
import { IDefaultFormat, IFormat } from '@deltix/hd.components-common';
export interface ILabelProps {
    x: number;
    y: number;
    style: Partial<PIXI.BitmapText | PIXI.TextStyle>;
    text: number | string;
    height: number;
    width: number;
    align: TextHorizontalAlign;
    formatFunction: IFormat | IDefaultFormat;
}
export declare class Label extends React.Component<ILabelProps> {
    render(): JSX.Element;
}
export declare type IXAxisLabelProps = Pick<ILabelProps, Exclude<keyof ILabelProps, 'align'>> & {
    position: 'top' | 'bottom';
    formatFunction: IFormat | IDefaultFormat;
};
export declare class XAxisLabel extends React.Component<IXAxisLabelProps> {
    static defaultProps: {
        align: TextHorizontalAlign;
    };
    render(): JSX.Element;
}
export interface IXAxisLabelWithBackground extends IXAxisLabelProps {
    color: number;
    alpha: number;
}
export declare class XAxisLabelWithBackground extends React.Component<IXAxisLabelWithBackground> {
    render(): JSX.Element;
}
export declare type IYAxisLabelProps = Pick<ILabelProps, Exclude<keyof ILabelProps, 'align'>> & {
    position: 'left' | 'right';
};
export declare class YAxisLabel extends React.Component<IYAxisLabelProps> {
    render(): JSX.Element;
}
export interface IYAxisLabelWithBackground extends IYAxisLabelProps {
    color: number;
    alpha: number;
}
export interface ITriangleLabelBackgroundProps {
    color: number;
    alpha: number;
    width: number;
    height: number;
    position: 'left' | 'right';
}
export declare const TriangleLabel: ({ color, alpha, width, height, position, }: ITriangleLabelBackgroundProps) => JSX.Element;
export declare const TriangleYAxisLabelWithBackground: (props: IYAxisLabelWithBackground) => JSX.Element;
export interface IColoredLabelProps extends IYAxisLabelWithBackground {
    coloredPart: {
        up: {
            color: number;
        };
        down: {
            color: number;
        };
    };
    nextRate: string;
}
export declare class ColoredRateLabel extends React.Component<IColoredLabelProps> {
    static getDerivedStateFromProps(props: IColoredLabelProps, state: any): {
        prevRate: any;
        nextRate: string;
    };
    state: {
        prevRate: string;
        nextRate: string;
    };
    private symbolWidth;
    render(): JSX.Element;
    private getColoredPartWidth;
    private getTintColor;
}
