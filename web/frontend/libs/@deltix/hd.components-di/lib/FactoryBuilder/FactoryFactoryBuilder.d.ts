import { AbstractFactoryBuilder } from "./AbstractFactoryBuilder";
export declare class FactoryFactoryBuilder<T> extends AbstractFactoryBuilder<T> {
    createFactory(definition: any, containerBuilder: any): () => any;
}
