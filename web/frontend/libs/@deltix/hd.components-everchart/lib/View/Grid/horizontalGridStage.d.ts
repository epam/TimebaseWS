import { Graphics, StageContext } from '@deltix/hd.components-multi-app';
import { AnyAction } from 'redux';
import { IEverChartPadState, IEverChartState } from '../../Store/everChartState';
export declare class HorizontalGridStage extends Graphics<IEverChartState> {
    protected pad: IEverChartPadState;
    setState(state: IEverChartState, context: StageContext, dispatch: (action: AnyAction) => void): void;
    setPad(pad: IEverChartPadState): void;
}
