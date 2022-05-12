import { Big } from 'big.js';
export interface IPrettyOptions {
    decimal?: string;
    thousands?: string;
    trailingZero?: boolean;
}
export declare const pretty: (value: Big, options?: IPrettyOptions) => string;
