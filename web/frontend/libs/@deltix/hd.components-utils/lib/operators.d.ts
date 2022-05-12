import { MonoTypeOperatorFunction } from "rxjs";
export declare type predicateType<T> = (value: T, index: number) => boolean;
/**
 * Emits values emitted by the source Observable so long as each value satisfies
 * the given `predicate`, and then completes after the last emitted value
 * satisfies the `predicate`.
 *
 * `takeWhileInclusive` subscribes and begins mirroring the source Observable.
 * Each value emitted on the source is emitted then given to the `predicate`
 * function which returns a boolean, representing a condition to be satisfied by
 * the source values. The output Observable emits the source values until such
 * time as the `predicate` returns false, at which point `takeWhileInclusive`
 * stops mirroring the source Observable and completes the output Observable.
 *
 * @param {function(value: T, index: number): boolean} predicate A function that
 * evaluates a value emitted by the source Observable and returns a boolean.
 * Also takes the (zero-based) index as the second argument.
 * @return {Observable<T>} An Observable that emits the values from the source
 * Observable and completes after emitting a value that satisfies the condition
 * defined by the `predicate`.
 * @method takeWhileInclusive
 * @owner Observable
 */
export declare function takeWhileInclusive<T>(predicate: predicateType<T>): MonoTypeOperatorFunction<T>;
