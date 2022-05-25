import { Container, StageContext } from '@deltix/hd.components-multi-app';
import * as PIXI from 'pixi.js';
import { AnyAction } from 'redux';
import { IEverChartState } from '../../Store/everChartState';
export declare class XAxisStage extends Container<IEverChartState> {
    private static symbolWidth;
    private buffer;
    constructor(stage: PIXI.Container, index?: number);
    setState(state: IEverChartState, context: StageContext, dispatch: (action: AnyAction) => void): void;
    destroy(): void;
}
