import Big from 'big.js';
import { IRange } from './Liner';
export declare const fLiner: (domain: IRange, range: IRange, x: number) => number;
export declare const fLinerDecimal: (domain: IRange<Big>, range: IRange<Big>, x: number | Big) => Big;
