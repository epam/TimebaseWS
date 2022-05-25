import { ICompilerPass } from '../../lib/Compiler';
import { ContainerBuilder } from '../../lib/ContainerBuilder';
export declare class BusPass implements ICompilerPass {
    process(containerBuilder: ContainerBuilder): Promise<void>;
}
