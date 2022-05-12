import Big from 'big.js';
export declare const getRealPrecision: (price: Big, precision: number, symbolWidth: number, maxWidth: number) => number;
export declare const splitPriceWithMaxWidth: (price: Big, precision: number, symbolWidth: number, maxWidth: number) => {
    ceil: string;
    decimal: string;
    zero: string;
};
export declare const splitPrice: (price: Big, precision: number) => {
    ceil: string;
    decimal: string;
    zero: string;
};
