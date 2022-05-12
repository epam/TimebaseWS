import { IContainer } from '@deltix/hd.components-di';
import { IEmbeddableAppPosition } from '@deltix/hd.components-multi-app';
import { IEverChartAppState } from './everChartState';
export declare const createEverChartInitialState: (container: IContainer, position: IEmbeddableAppPosition, appId: string) => Promise<IEverChartAppState>;
