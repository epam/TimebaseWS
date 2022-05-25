import { IMultiAppState } from "../Store/MultiApp/IMultiAppState";
export declare const selectEmbeddedApp: (appType: string, appId: string) => (state: IMultiAppState) => any;
export declare const selectEmbeddedAppState: (appType: string, appId: string) => (state: IMultiAppState) => any;
export declare const selectEmbeddedAppInitializationSate: (appType: string, appId: string) => (state: IMultiAppState) => any;
