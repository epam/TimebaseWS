import { Big, RoundingMode } from 'big.js';
import { IPrettyOptions } from './pretty';
export interface IFormatDecimalOptions extends IPrettyOptions {
    precision?: number;
    roundMode?: RoundingMode;
    abbreviate?: boolean;
}
export declare const baseFormatOptions: IFormatDecimalOptions;
export declare const formatDecimal: (value: Big, options?: IFormatDecimalOptions) => string;
