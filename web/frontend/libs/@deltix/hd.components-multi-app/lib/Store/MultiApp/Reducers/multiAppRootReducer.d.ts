import { Reducer } from "redux";
import { IMultiAppState } from "../IMultiAppState";
export declare const MultiAppRootReducer: (routedReducer: Reducer<IMultiAppState>, initialState: IMultiAppState) => (state: any, action: any) => IMultiAppState;
