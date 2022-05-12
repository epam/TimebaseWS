import { Selector } from "reselect";
import { IMultiAppState } from "../Store/MultiApp/IMultiAppState";
export declare const selectAppState: (appType: string, appId: string, selector: Selector<any, any>) => (state: IMultiAppState) => any;
