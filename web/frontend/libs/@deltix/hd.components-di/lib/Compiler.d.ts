import { ContainerBuilder } from "./ContainerBuilder";
export interface ICompilerPass {
    process(containerBuilder: ContainerBuilder, parameters: any): Promise<void>;
}
export declare class Compiler {
    private passes;
    addPass(pass: ICompilerPass, extensionName: string): this;
    compile(containerBuilder: ContainerBuilder): Promise<void>;
}
