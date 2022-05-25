import Big from 'big.js';
/**
 * @param min
 * @param max
 * @param ticks suggest count ticks
 */
export declare const createTicks: (min: number, max: number, ticks: number) => number[];
/**
 * @param min
 * @param max
 * @param ticks suggest count ticks
 */
export declare const createDecimalTicks: (min: Big, max: Big, ticks: number) => Big[];
