import { Container, Definition } from '@deltix/hd.components-di';
import { ComponentClass } from 'react';
import { IExtension, IExtensionRecord } from '../AppKernel/IExtension';
import { ComponentStage } from '../Stage/componentStage';
import { IEmbeddableAppPosition } from '../Store/MultiApp/IMultiAppState';
export declare abstract class AbstractEmbeddableKernel<P extends {}> {
    private extensionRecords;
    private globalBooted;
    private readonly globalContainerBuilder;
    private globalContainer;
    readonly parameters: {};
    constructor(parameters?: {});
    abstract getAppType(): string;
    getAppRoot?(): ComponentClass;
    getApp?(): typeof ComponentStage;
    boot(params: any, position: IEmbeddableAppPosition, appId: string): Promise<{
        epic: any;
        reducer: any;
        container: any;
    }>;
    addExtension(extension: IExtension, priority?: number): void;
    createContainer(params: P, env: string): Promise<Container>;
    protected abstract createReducerAndEpic(container: Container, position: IEmbeddableAppPosition, appId: string): Promise<{
        epic: any;
        reducer: any;
    }>;
    protected getDefaultParams(): {};
    protected getAppDefinitions(): {
        [key: string]: Definition<any>;
    };
    protected getGlobalDefinitions(): {
        [p: string]: Definition<any>;
    };
    protected getExtensions(): IExtensionRecord[];
    private bootGlobal;
    private getSortedExtensions;
    private resolveParameters;
}
