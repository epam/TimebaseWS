import { Container, StageContext } from '@deltix/hd.components-multi-app';
import * as PIXI from 'pixi.js';
import { AnyAction } from 'redux';
import { IEverChartPadState, IEverChartState } from '../../Store/everChartState';
export declare class YAxisStage extends Container<IEverChartState> {
    private static symbolWidth;
    private buffer;
    protected pad: IEverChartPadState;
    constructor(stage: PIXI.Container, index?: number);
    setState(state: IEverChartState, context: StageContext, dispatch: (action: AnyAction) => void): void;
    setPad(pad: IEverChartPadState): void;
    destroy(): void;
}
