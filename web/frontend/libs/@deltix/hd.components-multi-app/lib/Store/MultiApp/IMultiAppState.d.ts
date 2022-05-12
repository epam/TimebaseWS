import { EThemes } from "@deltix/hd.components-common";
export interface IEmbeddableAppPosition {
    width: number;
    height: number;
    x: number;
    y: number;
}
export declare enum EEmbeddableAppState {
    initializing = "initializing",
    initialized = "initialized",
    failed = "failed",
    no_data_wait = "no_data_wait",
    no_data = "no_data"
}
export interface IMultiContainer {
    state: {
        app: {};
    };
    position: IEmbeddableAppPosition;
    containerState: EEmbeddableAppState;
}
export interface IAppMap {
    [appType: string]: {
        [appId: string]: IMultiContainer;
    };
}
export interface IMultiAppState {
    apps: IAppMap;
    theme: EThemes;
}
export declare const multiAppInitialState: IMultiAppState;
