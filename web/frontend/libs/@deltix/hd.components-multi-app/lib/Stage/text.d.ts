import { IBitmapTextStyle } from '@deltix/hd.components-common';
import * as PIXI from 'pixi.js';
import { AnyAction } from 'redux';
import { Container } from './container';
import { StageContext } from './stageContext';
interface IText {
    text: string;
    style: IBitmapTextStyle;
    x: number;
    y: number;
    height: number;
    width: number;
    verticalAlign?: 'top' | 'mid' | 'bottom';
    horizontalAlign?: 'left' | 'mid' | 'right';
    interactive?: boolean;
    pointerdown?: () => void;
}
interface ITextWithBackground extends IText {
    backgroundColor: number;
    backgroundAlpha: number;
    triangle?: boolean;
}
export declare class Text extends Container<IText> {
    protected textElement: PIXI.Text | PIXI.BitmapText;
    setState(state: IText, context: StageContext, dispatch: (action: AnyAction) => void): void;
    destroy(): void;
    protected init(text: string, style: IBitmapTextStyle): void;
}
export declare class TextWithBackground extends Text {
    protected g: PIXI.Graphics;
    constructor(stage: PIXI.Container, index?: number);
    setState(state: ITextWithBackground, context: StageContext, dispatch: (action: AnyAction) => void): void;
    destroy(): void;
}
export {};
