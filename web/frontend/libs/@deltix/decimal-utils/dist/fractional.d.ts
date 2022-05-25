import { Big } from 'big.js';
export declare const toFractional: (decimal: Big, mainFraction?: number, subFraction?: number) => string;
export declare const toFractionalDecimalSubfraction: (decimal: Big, mainFraction?: number, subFraction?: number) => string;
export declare const fromFractional: (str: string, mainFraction?: number, subFraction?: number) => Big;
