import Big from 'big.js';
export interface IRange<T extends number | Big = number> {
    from: T;
    to: T;
}
export declare type RangeFn = () => IRange;
/**
 * @internal
 */
export declare class Liner {
    compute: (x: number) => number;
    computeReverse: (x: number) => number;
    createReverse(): Liner;
    setRange: (from: number, to: number) => this;
    setDomain: (from: number, to: number) => this;
    setDomainFn: (fn: RangeFn) => this;
    getFirstValue(): number;
    getLastValue(): number;
    setRangeFn: (fn: RangeFn) => this;
    getRange: () => RangeFn;
    getDomain: () => RangeFn;
    clone(): Liner;
    protected doCompute(domain: IRange, range: IRange, x: number): number;
    private range;
    private domain;
}
