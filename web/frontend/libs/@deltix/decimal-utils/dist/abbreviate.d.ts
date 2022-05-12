import { Big, RoundingMode } from 'big.js';
import { IPrettyOptions } from './pretty';
export interface IAbbreviateDecimalOptions extends IPrettyOptions {
    roundMode?: RoundingMode;
    short?: boolean;
    precision?: number;
}
export declare const abbreviateDecimal: (value: Big, options?: IAbbreviateDecimalOptions) => string;
