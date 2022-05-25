import { IEmbeddableAppPosition } from './IMultiAppState';
export declare const createEmbeddableAppAction: (appType: string, appId: string, position: IEmbeddableAppPosition, createParams: any) => {
    type: string;
    payload: {
        appType: string;
        appId: string;
        position: IEmbeddableAppPosition;
        createParams: any;
    };
};
export declare const embeddableAppInitializingAction: (appType: string, appId: string, position: IEmbeddableAppPosition) => {
    type: string;
    payload: {
        appType: string;
        appId: string;
        position: IEmbeddableAppPosition;
    };
};
export declare const appInitializedAction: () => {
    type: string;
};
export declare const embeddableAppInitializedAction: (appType: string, appId: string) => {
    type: string;
    payload: {
        appType: string;
        appId: string;
    };
};
export declare const embeddableAppKernelCreatedAction: (appType: string, appId: string, position: IEmbeddableAppPosition, state: any) => {
    type: string;
    payload: {
        appType: string;
        appId: string;
        state: any;
        position: IEmbeddableAppPosition;
    };
};
/**
 * API
 */
export declare const embeddableAppUpdatePositionAction: (appType: string, appId: string, newPosition: IEmbeddableAppPosition) => {
    type: string;
    payload: {
        appType: string;
        appId: string;
        newPosition: IEmbeddableAppPosition;
    };
};
export declare const embeddableAppFailedAction: (appType: string, appId: string, error: any) => {
    type: string;
    payload: {
        appType: string;
        appId: string;
        error: any;
    };
};
export declare const noDataAction: () => {
    type: string;
};
export declare const embeddableAppNoDataAction: (appType: string, appId: string) => {
    type: string;
    payload: {
        appType: string;
        appId: string;
    };
};
/**
 * API
 */
export declare const destroyEmbeddableAppAction: (appType: string, appId: string) => {
    type: string;
    payload: {
        appType: string;
        appId: string;
    };
};
export declare const terminateMultiAppAction: () => {
    type: string;
};
/**
 * API
 */
export declare const changeThemeAction: (theme: string) => {
    type: string;
    payload: {
        theme: string;
    };
};
