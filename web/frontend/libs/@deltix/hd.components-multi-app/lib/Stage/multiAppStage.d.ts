import * as PIXI from 'pixi.js';
import { Store } from 'redux';
import { ComponentStage } from './componentStage';
import { StageContext } from './stageContext';
export declare class MultiAppStage {
    private renderer;
    private stage;
    private store;
    private children;
    private subscription;
    private emitter;
    private context;
    constructor(renderer: PIXI.Renderer, stage: PIXI.Container, store: Store);
    setContext(context: StageContext): void;
    append<T extends ComponentStage>(comp: new (stage: PIXI.Container) => T): void;
    private notify;
    private dispatch;
    destroy(): void;
}
