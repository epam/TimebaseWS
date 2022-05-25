import { Container } from '@deltix/hd.components-di';
import { AnyAction } from 'redux';
import { Subject } from 'rxjs';
import { AbstractEmbeddableKernel } from '../Kernel/AbstractEmbeddableKernel';
import { IContainerMap } from '../MultiAppFacade';
export declare type EmbeddableKernels = AbstractEmbeddableKernel<any>[];
export declare const createMultiAppStore: (kernels: EmbeddableKernels, container: Container, containerMap: IContainerMap) => {
    store: undefined;
    actionStream$: Subject<AnyAction>;
};
