import { Graphics, StageContext } from '@deltix/hd.components-multi-app';
import { AnyAction } from 'redux';
import { IEverChartState } from '../../Store/everChartState';
export declare class VerticalGridStage extends Graphics<IEverChartState> {
    setState(state: IEverChartState, context: StageContext, dispatch: (action: AnyAction) => void): void;
}
