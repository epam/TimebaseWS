import * as PIXI from 'pixi.js';
import { ComponentStage } from './componentStage';
export declare abstract class Container<T> extends ComponentStage<T> {
    protected index?: number;
    protected root: PIXI.Container;
    constructor(stage: PIXI.Container, index?: number);
    destroy(): void;
}
