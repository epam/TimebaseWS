import { HdDate } from "./hd-date";
import { DateTimeFormat, FullNameDigit } from "./types";
export declare const DENOMINATOR = 1000;
export declare const REGULAR_LETTERS: RegExp;
export declare const REGULAR_ISO: RegExp;
export declare const REGULAR_TIME = "[0-9][0-9]?:[0-9][0-9]?:[0-9][0-9]?";
export declare const REGULAR_DATE = "[A-Za-z]{3},? [A-Za-z]{3} [0-9]{2} [0-9]{4}?";
export declare const REGULAR_LOCAL_DATE = "[0-9]+/[0-9]+/[0-9]{4}";
export declare const REGULAR_UTC_DATE = "[A-Za-z]{3}, [0-9]{2} [A-Za-z]{3} [0-9]{4}";
export declare const FORMAT_DEFAULT = "MM/dd/yyyy hh:mm:ss.fffffffff tt";
export declare const FORMAT_ISO = "yyyy-MM-dd HH:mm:ss.fffffffff";
export declare function getValueDigit(date: HdDate, format: string[], locale?: string): string[];
export declare function getFullNameDigit(digit: DateTimeFormat): FullNameDigit;
export declare function padStart(numberSymbol: number, word: string): string;
export declare function getStringByFormat(values: string[], format: string, formatString?: string): string;
export declare function getEndTime(hdDate: HdDate): string;
export declare function setValue(digit: DateTimeFormat, value: number, date: HdDate): void;
export declare function checkData(digit: DateTimeFormat, value: string, hdDate: HdDate): boolean;
export declare function getValue(values: string[], digit: string): string;
export declare function correctHours(value: string, digit: string): string;
export declare function convertDate(values: string, format: string[]): string[];