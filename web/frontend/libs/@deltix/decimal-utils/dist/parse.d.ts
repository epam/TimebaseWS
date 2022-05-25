import { Big } from 'big.js';
export interface IParseDecimalOptions {
    decimal?: string;
    abbreviate?: boolean;
}
export declare const baseParseOptions: IParseDecimalOptions;
export declare const parseDecimal: (value: number | string, options?: IParseDecimalOptions) => Big;
