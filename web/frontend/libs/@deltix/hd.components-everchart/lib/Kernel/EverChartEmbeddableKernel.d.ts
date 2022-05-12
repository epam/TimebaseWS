import { Container } from '@deltix/hd.components-di';
import { AbstractEmbeddableKernel, IEmbeddableAppPosition } from '@deltix/hd.components-multi-app';
export declare class EverChartEmbeddableKernel extends AbstractEmbeddableKernel<any> {
    constructor(params?: {
        default: {
            resource: {
                resources: {
                    name: string;
                    path: string;
                    type: import("@deltix/hd.components-utils").EResourceType;
                }[];
            };
        };
    });
    getApp(): any;
    getAppType(): string;
    protected createReducerAndEpic(container: Container, position: IEmbeddableAppPosition, appId: string): Promise<{
        epic: any;
        reducer: any;
    }>;
}
