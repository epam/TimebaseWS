import * as PIXI from 'pixi.js';
import { Color, EverChartShapeType, IEverChartBaseItem } from '../everChartParams';
import { IEverChartPadState, IEverChartState } from '../everChartState';
export interface IShape {
    centerX: number;
    centerY: number;
    size: number;
    type: EverChartShapeType;
    color: Color;
    points: PIXI.IPoint[];
    lineWidth: number;
}
export declare const selectEverChartShapes: (state: IEverChartState, pad: IEverChartPadState, padItem: IEverChartBaseItem) => IShape[];
