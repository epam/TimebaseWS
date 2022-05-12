import { Factory } from './Container';
export interface IParameters {
    [key: string]: any;
}
export interface IContainer {
    has(id: string): boolean;
    get<T>(id: string): T;
    getIds(): string[];
    merge(container: IContainer): any;
    setFactory<T>(id: string, factory: Factory<T>, shared: boolean): void;
    set<T>(id: string, inst: T): void;
    getOptionalParameter<T>(id: string): T | null;
    getParameter<T>(id: string): T;
    setParameters(parameters: IParameters): void;
}
