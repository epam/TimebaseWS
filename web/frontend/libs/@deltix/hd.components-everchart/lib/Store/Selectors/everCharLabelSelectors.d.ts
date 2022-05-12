import { IBitmapTextStyle } from 'pixi.js';
import { Color, IEverChartBaseItem } from '../everChartParams';
import { IEverChartPadState, IEverChartState } from '../everChartState';
interface ILabel {
    text: string;
    x: number;
    y: number;
    textStyle: IBitmapTextStyle;
    color: Color;
}
export declare const selectEverChartLabels: (state: IEverChartState, pad: IEverChartPadState, padItem: IEverChartBaseItem) => ILabel[];
export {};
