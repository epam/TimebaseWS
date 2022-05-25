export interface IResource<T> {
    resolve(): T;
}
export declare class ObjectResource<T> implements IResource<T> {
    object: T;
    constructor(object: T);
    resolve(): T;
}
