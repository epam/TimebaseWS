import { Big } from 'big.js';
export declare const equalDecimal: (value1: Big, value2: Big) => boolean;
export declare const minDecimal: (d1: Big, d2: Big) => Big;
export declare const maxDecimal: (d1: Big, d2: Big) => Big;
export declare const compareDecimals: (value1: Big, value2: Big) => 1 | 0 | -1;
