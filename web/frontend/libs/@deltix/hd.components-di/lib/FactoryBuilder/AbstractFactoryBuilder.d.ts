import { ContainerBuilder } from "../ContainerBuilder";
import { Definition } from "../Definition/Definition";
export interface IFactoryBuilder<T> {
    createFactory(definition: Definition<T>, containerBuilder: ContainerBuilder): any;
}
export declare abstract class AbstractFactoryBuilder<T> implements IFactoryBuilder<T> {
    resolveArguments(args: any, containerBuilder: ContainerBuilder): any;
    abstract createFactory(definition: Definition<T>, containerBuilder: ContainerBuilder): any;
}
