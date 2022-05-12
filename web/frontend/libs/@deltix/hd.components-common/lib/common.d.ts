import { BitmapText, TextStyle as PixiTextStyle } from 'pixi.js';
export declare enum EAggregationTypes {
    price = "price",
    quantity = "quantity",
    quantityTotalPrice = "quantityTotalPrice",
    quantityAveragePrice = "quantityAveragePrice"
}
export interface IBitmapTextStyle extends Partial<BitmapText> {
    fill?: number;
}
export declare type TextStyle = IBitmapTextStyle | PixiTextStyle;
export interface IFormatFunctions {
    [key: string]: IFormat;
}
export interface IFormattedNumber {
    integerPart: string;
    fractionalPart: string;
    decimalSeparator: string;
}
export declare type IFormat = (numberToFormat: string) => IFormattedNumber;
export declare type IDefaultFormat = (value: string) => string;
export declare const noopFormatFunction: IFormat;
export declare const noopDefaultFormatFunction: IDefaultFormat;
