import { AnyAction, Reducer } from 'redux';
export declare const createRootReducer: <T>(reducerMap: any, initialState?: T) => (state: T, action: AnyAction) => T;
export declare const rootSymbol = "@root";
export declare const combineMaps: (...maps: any[]) => Reducer<any, AnyAction>;
export declare const mergeReducer: (...reducers: Reducer[]) => Reducer;
export declare const enhanceReducer: (part: string, reducer: Reducer) => (state: any, action: any) => any;
