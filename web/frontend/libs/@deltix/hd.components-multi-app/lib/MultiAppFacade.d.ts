import { ThemeMap } from '@deltix/hd.components-common';
import { Container } from '@deltix/hd.components-di';
import * as React from 'react';
import { AnyAction, DeepPartial } from 'redux';
import { Observable } from 'rxjs';
import { EmbeddableKernels } from './Store/createMultiAppStore';
import { EEmbeddableAppState, IEmbeddableAppPosition, IMultiAppState } from './Store/MultiApp/IMultiAppState';
export declare const StoreContext: React.Context<any>;
export interface IContainerMap {
    [appType: string]: {
        [appId: string]: Container;
    };
}
export interface IMultiAppFacadeParams {
    tick?: number;
    resolveResource: (name: string, path: string) => string;
    nonce?: string;
}
export declare class MultiAppFacade {
    private kernels;
    private themes;
    private store;
    private actionStream$;
    private stage;
    private container;
    private tweenRegistry;
    private containerMap;
    private destroyed;
    private ticker;
    private resourceFontLoader;
    private gTick;
    private gTime;
    private renderer;
    private multiAppStage;
    constructor(kernels: EmbeddableKernels, mountNode: HTMLElement, debugMode?: boolean, themes?: DeepPartial<ThemeMap>, params?: IMultiAppFacadeParams);
    createApp(appType: string, appId: string, position: IEmbeddableAppPosition, createParams: any): Observable<EEmbeddableAppState>;
    destroyApp(appType: string, appId: string): void;
    dispatch(action: AnyAction): void;
    dispatchTo(action: AnyAction, appType: string, appId: string): void;
    getStateStream(): Observable<IMultiAppState>;
    getStateStreamFor<T>(appType: string, appId: string): Observable<T>;
    getSate(): IMultiAppState;
    getStateFor(appType: string, appId: string): any;
    getActionStream(): Observable<AnyAction>;
    getActionStreamFor(appType: string, appId: string): Observable<AnyAction>;
    destroy(): void;
    private renderStage;
    private startLoop;
    private stopLoop;
    private onTick;
    private assertNotDestroyed;
}
