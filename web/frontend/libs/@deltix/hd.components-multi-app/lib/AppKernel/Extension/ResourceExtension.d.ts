import { ContainerBuilder } from '@deltix/hd.components-di';
import { IExtension } from '../IExtension';
export declare class ResourceExtension implements IExtension {
    processGlobal(containerBuilder: ContainerBuilder): void;
    processApp(containerBuilder: ContainerBuilder, parameters: any): void;
    getName(): string;
}
