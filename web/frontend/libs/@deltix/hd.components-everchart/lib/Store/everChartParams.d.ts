import { IBitmapTextStyle, IFormat } from '@deltix/hd.components-common';
import { IEverChartDataItem } from './everChartState';
export declare const DEFAULT_INTERVAL_GAP = 5;
export declare enum EverChartPadItem {
    LINE = "LINE",
    SHAPE = "SHAPE",
    LABEL = "LABEL",
    INTERVAL = "INTERVAL",
    VOLUME = "VOLUME",
    SHAPE_WITH_LABEL = "SHAPE_WITH_LABEL",
    RANGE_AREA = "RANGE_AREA"
}
export interface IEverChartPad {
    id: string;
    items: IEverChartPadItem[];
    initialHeight?: string;
}
export interface IEverChartBaseItem {
    id: string;
    type: EverChartPadItem;
}
export declare type EverChartItemUnion<T extends IEverChartBaseItem, U extends IEverChartBaseItem> = Omit<T & U, 'type'>;
export declare type Color = number | string;
export interface IEverChartVolumeItem extends IEverChartBaseItem {
    type: EverChartPadItem.VOLUME;
    color: Color;
    getVolume: (data: IEverChartDataItem) => number;
    getIntervalWidth: (data: IEverChartDataItem) => number;
}
export declare enum EverChartIntervalType {
    bar = "bar",
    candle = "candle"
}
export interface IEverChartIntervalItem extends IEverChartBaseItem {
    type: EverChartPadItem.INTERVAL;
    intervalType: EverChartIntervalType;
    riseColor: Color;
    fallColor: Color;
    getLow: (data: IEverChartDataItem) => number;
    getHigh: (data: IEverChartDataItem) => number;
    getOpen: (data: IEverChartDataItem) => number;
    getClose: (data: IEverChartDataItem) => number;
    getIntervalWidth: (data: IEverChartDataItem) => number;
}
export declare enum EverChartShapeType {
    square = "square",
    circle = "circle",
    triangle = "triangle",
    rhombus = "rhombus",
    flag = "flag",
    arrow = "arrow",
    cross = "cross",
    crossCircle = "crossCircle"
}
export interface IEverChartShapeItem extends IEverChartBaseItem {
    type: EverChartPadItem.SHAPE;
    shapeColor: Color;
    shapeSize: number;
    shapeType: EverChartShapeType;
    shapeLineWidth?: number;
    getY: (data: IEverChartDataItem) => number;
    getShapeType?: (data: IEverChartDataItem) => EverChartShapeType;
    getShapeSize?: (data: IEverChartDataItem) => number;
    getShapeColor?: (data: IEverChartDataItem) => Color;
    getShapeRotation?: (data: IEverChartDataItem) => number;
}
export interface IEverChartLabelItem extends IEverChartBaseItem {
    type: EverChartPadItem.LABEL;
    color: Color;
    textStyle: IBitmapTextStyle;
    getY: (data: IEverChartDataItem) => number;
    getTextStyle?: (data: IEverChartDataItem) => IBitmapTextStyle;
    getFontColor?: (data: IEverChartDataItem) => Color;
    getText: (data: IEverChartDataItem) => string | null;
}
export declare enum EverChartLineItemDrawType {
    after = "after",
    before = "before",
    afterWithoutLink = "afterWithoutLink",
    beforeWithoutLink = "beforeWithoutLink"
}
export declare enum EverChartLineItemRenderType {
    interrupt = "interrupt"
}
export interface IEverChartLineItem extends IEverChartBaseItem {
    type: EverChartPadItem.LINE;
    color: Color;
    lineWidth?: number;
    topAreaColor?: Color;
    bottomAreaColor?: Color;
    drawType?: EverChartLineItemDrawType;
    renderType?: EverChartLineItemRenderType;
    getY: (data: IEverChartDataItem) => number;
}
export interface IEverChartRangeAreaItem extends IEverChartBaseItem {
    type: EverChartPadItem.RANGE_AREA;
    color: Color;
    lineWidth?: number;
    background1: Color;
    background2: Color;
    drawType1?: EverChartLineItemDrawType;
    drawType2?: EverChartLineItemDrawType;
    getY1: (data: IEverChartDataItem) => number;
    getY2: (data: IEverChartDataItem) => number;
}
export interface IEverChartShapeWithLabelItem extends EverChartItemUnion<IEverChartShapeItem, IEverChartLabelItem> {
    type: EverChartPadItem.SHAPE_WITH_LABEL;
}
export declare type IEverChartPadItem = IEverChartIntervalItem | IEverChartShapeItem | IEverChartLabelItem | IEverChartLineItem | IEverChartVolumeItem | IEverChartShapeWithLabelItem | IEverChartRangeAreaItem;
export declare type IDateFormat = (tick: number, interval?: number) => string;
export interface IFormatFunctions {
    xAxis?: IDateFormat;
    xCrosshair?: IDateFormat;
    yAxis?: IFormat;
    yCrosshair?: IFormat;
}
export interface IEverChartParams {
    pads: IEverChartPad[];
    maxBucketSize: number;
    initialTime?: number | [number, number];
    minTime?: number;
    maxTime?: number;
    initialZoom?: number;
    initialInterval?: number;
    minInterval?: number;
    maxInterval?: number;
    disableMagnet?: boolean;
    formatFunctions?: IFormatFunctions;
    /**
     * [1 - infinity)
     */
    animationDuration?: number;
    disableBackButton?: boolean;
}
