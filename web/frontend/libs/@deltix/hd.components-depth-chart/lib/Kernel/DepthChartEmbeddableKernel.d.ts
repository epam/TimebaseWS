import { Container } from '@deltix/hd.components-di';
import { AbstractEmbeddableKernel } from '@deltix/hd.components-multi-app';
import * as React from 'react';
export declare class DepthChartEmbeddableKernel extends AbstractEmbeddableKernel<any> {
    getAppRoot(): React.ComponentClass;
    getAppType(): string;
    protected createReducerAndEpic(container: Container, _: any, appId: string): Promise<{
        epic: any;
        reducer: any;
    }>;
}
