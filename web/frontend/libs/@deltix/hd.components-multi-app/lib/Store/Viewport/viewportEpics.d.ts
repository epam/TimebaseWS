import PIXI from 'pixi.js';
import { Action, AnyAction } from 'redux';
import { ActionsObservable, Epic } from 'redux-observable';
export declare const ViewportEpic: (mountNode: HTMLElement, renderer: PIXI.Renderer) => Epic<any, any, any, any>;
export declare const UpdateAppEpic: (action$: ActionsObservable<AnyAction>) => import("rxjs").Observable<{
    metadata: any;
    type: any;
}>;
export declare const UpdateEpic: (mountNode: HTMLElement) => Epic<any, any>;
export declare const ResizeEpic: (renderer: PIXI.Renderer) => (action$: ActionsObservable<Action>) => import("rxjs").Observable<never>;
