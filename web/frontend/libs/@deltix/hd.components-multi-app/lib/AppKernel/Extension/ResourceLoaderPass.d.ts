import { ContainerBuilder, ICompilerPass } from "@deltix/hd.components-di";
import { EResourceType } from "@deltix/hd.components-utils";
export interface IResourceRecord {
    path: string;
    name: string;
    type: EResourceType;
}
export declare class ResourceLoaderPass implements ICompilerPass {
    process(containerBuilder: ContainerBuilder, parameters: any): Promise<void>;
}
