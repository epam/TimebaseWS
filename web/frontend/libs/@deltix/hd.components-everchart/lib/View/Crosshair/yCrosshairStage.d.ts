import { Graphics, StageContext, TextWithBackground } from '@deltix/hd.components-multi-app';
import { AnyAction } from 'redux';
import { IEverChartPadState, IEverChartState } from '../../Store/everChartState';
export declare class YCrosshairStage extends Graphics<IEverChartState> {
    protected static symbolWidth: number;
    protected pad: IEverChartPadState;
    protected text: TextWithBackground;
    setState(state: IEverChartState, context: StageContext, dispatch: (action: AnyAction) => void): void;
    setPad(pad: IEverChartPadState): void;
    destroy(): void;
}
