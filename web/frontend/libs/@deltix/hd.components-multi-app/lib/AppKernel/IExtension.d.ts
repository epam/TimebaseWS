import { ContainerBuilder } from '@deltix/hd.components-di';
export interface IExtension {
    processGlobal(containerBuilder: ContainerBuilder): void;
    processApp(containerBuilder: ContainerBuilder, parameters: any): void;
    getName(): string;
}
export interface IExtensionRecord {
    extension: IExtension;
    priority: number;
}
