import { IFormat } from '@deltix/hd.components-common';
export declare const SECOND_FORMAT = "HH:mm:ss.fff";
export declare const MINUTE_FORMAT = "HH:mm:ss";
export declare const HOUR_FORMAT = "HH:mm:ss";
export declare const DAY_FORMAT = "yyyy-MM-dd";
export declare const MONTH_FORMAT = "yyyy-MM-dd";
export declare const YEAR_FORMAT = "yyyy-MM";
export declare const FULL_FORMAT = "yyyy-MM-dd HH:mm:ss.fff";
declare type IDateFormat = (tick: number, interval?: number) => string;
export declare const formatAxisDate: (time: number, interval?: number) => string;
export declare const formatY: (value: number, formatter?: IFormat) => import("@deltix/hd.components-common").IFormattedNumber;
export declare const formatX: (value: number, interval: number, formatter?: IDateFormat) => string;
export {};