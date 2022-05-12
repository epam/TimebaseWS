import { AbstractFactoryBuilder } from "./AbstractFactoryBuilder";
export declare class ClassFactoryBuilder<T> extends AbstractFactoryBuilder<T> {
    createFactory(definition: any, containerBuilder: any): () => any;
}
