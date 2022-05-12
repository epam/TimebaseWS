import { IResource } from "../Resource";
export declare class Factory<T> {
    resource: IResource<T>;
    method: any;
    constructor(resource: IResource<T>, method: any);
}
