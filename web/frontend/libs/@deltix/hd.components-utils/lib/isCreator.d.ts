import { StateObservable } from 'redux-observable';
import { Observable } from 'rxjs';
import { ActionCreator } from './getType';
declare type C = ActionCreator;
declare type R<T extends (...args: any[]) => any> = Observable<ReturnType<T>>;
export declare function isCreator<T extends C>(c: T): () => R<T>;
export declare function isCreator<T extends C, T1 extends C>(c: T, c1: T1): () => R<T | T1>;
export declare function isCreator<T extends C, T1 extends C, T3 extends C>(c: T, c1: T1, с3: T3): () => R<T | T1 | T3>;
export declare function isCreator<T extends C, T1 extends C, T3 extends C, T4 extends C>(c: T, c1: T1, с3: T3, с4: T4): () => R<T | T1 | T3 | T4>;
export declare function isCreator<T extends C, T1 extends C, T3 extends C, T4 extends C, T5 extends C>(c: T, c1: T1, с3: T3, с4: T4, c5: T5): () => R<T | T1 | T3 | T4 | T5>;
export declare function isCreator<T extends C, T1 extends C, T3 extends C, T4 extends C, T5 extends C, T6 extends C>(c: T, c1: T1, с3: T3, с4: T4, c5: T5, c6: T6): () => R<T | T1 | T3 | T4 | T5 | T6>;
export declare const select: <T extends (...args: any[]) => any>(selector: T) => (state$: StateObservable<any>) => import("rxjs").OperatorFunction<any, ReturnType<T>>;
export {};
