import * as PIXI from 'pixi.js';
import { ComponentStage } from './componentStage';
export declare abstract class Graphics<T> extends ComponentStage<T> {
    protected index?: number;
    protected root: PIXI.Graphics;
    constructor(stage: PIXI.Container, index?: number);
    destroy(): void;
}
