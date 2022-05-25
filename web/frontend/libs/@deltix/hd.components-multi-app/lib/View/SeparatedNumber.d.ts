import { TextStyle } from '@deltix/hd.components-common';
import * as React from 'react';
import { TextHorizontalAlign } from './Graphics/AlignText';
export interface ISeparatedNumberProps {
    parts: {
        part: string;
        style: TextStyle;
    }[];
    width: number;
    height: number;
    align?: TextHorizontalAlign;
}
export declare class SeparatedNumber extends React.Component<ISeparatedNumberProps> {
    private textRefs;
    private containerRef;
    render(): JSX.Element;
    shouldComponentUpdate(nextProps: any, nextState: any): boolean;
    componentDidMount(): void;
    componentDidUpdate(prevProps: Readonly<ISeparatedNumberProps>): void;
    private setRef;
    private update;
    private getLetterHeight;
}
