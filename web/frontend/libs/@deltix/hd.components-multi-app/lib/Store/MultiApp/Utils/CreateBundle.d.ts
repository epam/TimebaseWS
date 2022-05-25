import { EmbeddableKernels } from '../../createMultiAppStore';
import { CreateEmbeddableAppAction } from './types';
export declare const CreateBundle: (kernels: EmbeddableKernels, globalParams: {}) => ({ payload: { createParams, appType, position, appId }, }: CreateEmbeddableAppAction) => Promise<{
    epic: any;
    reducer: any;
    container: any;
}>;
