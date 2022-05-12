import * as PIXI from 'pixi.js';
import { Action } from 'redux';
import { ActionsObservable } from 'redux-observable';
export declare const resizeEpic: (renderer: PIXI.Renderer) => (action$: ActionsObservable<Action>) => import("rxjs").Observable<never>;
