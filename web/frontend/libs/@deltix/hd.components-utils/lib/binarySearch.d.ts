export declare type BinarySearch<T, U = T> = (haystack: T[], needle: U) => [number, boolean];
/**
 * Return tuple (number, bool).
 *
 * IF price founded second value will be true first will be index of element.
 * ELSE first value will index of nearest element and second value will be false.
 */
export declare const binarySearch: <T, U = T>(comparator: (a: T, b: U) => number) => (direction: "ASC" | "DESC") => BinarySearch<T, U>;
