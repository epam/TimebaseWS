import { AnyAction, Reducer } from 'redux';
import { IMultiAppState } from '../IMultiAppState';
export interface IAppRoute {
    appType: string;
    id: string;
}
export interface IReducerMap {
    [appType: string]: {
        [appId: string]: Reducer<any>;
    };
}
export declare const getAppState: (state: IMultiAppState, { appType, id }: IAppRoute) => any;
export declare const isAppAction: (action: AnyAction) => any;
export declare const createRoutedReducer: (reducerMap: IReducerMap) => (state: IMultiAppState, action: AnyAction) => IMultiAppState;
