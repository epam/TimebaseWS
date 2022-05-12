import * as PIXI from 'pixi.js';
import { AnyAction } from 'redux';
import { StageContext } from './stageContext';
export declare abstract class ComponentStage<T = any> {
    protected stage: PIXI.Container;
    protected index?: number;
    constructor(stage: PIXI.Container, index?: number);
    abstract setState(state: T, context: StageContext, dispatch: (action: AnyAction) => void): void;
    abstract destroy(): void;
}
