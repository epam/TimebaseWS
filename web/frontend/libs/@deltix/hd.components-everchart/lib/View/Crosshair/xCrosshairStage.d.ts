import { Graphics, StageContext, TextWithBackground } from '@deltix/hd.components-multi-app';
import { AnyAction } from 'redux';
import { IEverChartState } from '../../Store/everChartState';
export declare class XCrosshairStage extends Graphics<IEverChartState> {
    protected static symbolWidth: number;
    protected text: TextWithBackground;
    setState(state: IEverChartState, context: StageContext, dispatch: (action: AnyAction) => void): void;
    destroy(): void;
}
