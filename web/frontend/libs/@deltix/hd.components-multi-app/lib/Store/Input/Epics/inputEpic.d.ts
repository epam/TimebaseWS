import * as PIXI from 'pixi.js';
import { IEmbeddableAppPosition } from '../../MultiApp/IMultiAppState';
export declare const inputEpic: (stage: PIXI.Container, renderer: PIXI.Renderer) => (position: IEmbeddableAppPosition, type: string, id: string) => any;
