import * as PIXI from 'pixi.js';
import { StateObservable } from 'redux-observable';
import { IEmbeddableAppPosition, IMultiAppState } from '../IMultiAppState';
import { ActionStream } from '../Utils/types';
export declare const createInputSource: (stage: PIXI.Container, renderer: PIXI.Renderer) => (action$: ActionStream, store$: StateObservable<IMultiAppState>) => (position: IEmbeddableAppPosition, type: string, id: string) => any;
