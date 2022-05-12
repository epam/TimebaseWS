import { ComponentStage, IMultiAppState, StageContext } from '@deltix/hd.components-multi-app';
import { AnyAction } from 'redux';
export declare class EverChartStage extends ComponentStage<IMultiAppState> {
    private apps;
    setState(state: IMultiAppState, context: StageContext, dispatch: (action: AnyAction) => void): void;
    destroy(): void;
}
