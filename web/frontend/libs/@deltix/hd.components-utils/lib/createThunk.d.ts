declare type F<T> = <T>() => T;
export declare const createThunk: <T>(v: T | F<T>) => F<T>;
export {};
