import { IContainer, IParameters } from './ContainerInterface';
export declare type Factory<T> = () => T;
export interface IContainerAware {
    setContainer(container: IContainer): void;
}
export declare class Container implements IContainer {
    private factories;
    private services;
    private parameters;
    has(id: string): boolean;
    getIds(): string[];
    get<T>(id: string): T;
    getOptionalParameter<T>(id: string): T | null;
    getParameter<T>(id: string): T;
    setParameters(parameters: IParameters): void;
    setFactory<T>(id: string, factory: Factory<T>, shared: boolean): void;
    set<T>(id: string, inst: T): void;
    merge(container: Container): void;
    private doGet;
}
