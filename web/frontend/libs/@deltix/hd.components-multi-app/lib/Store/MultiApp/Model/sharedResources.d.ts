import { Reducer } from "redux";
import { Container } from "@deltix/hd.components-di";
import { IContainerMap } from "../../../MultiAppFacade";
import { IReducerMap } from "../Reducers/routedReducer";
export declare const sharedResources: (containerMap: IContainerMap, reducerMap: IReducerMap) => {
    save: (container: Container, reducer: Reducer<any>, appType: string, appId: string) => void;
    remove: (appType: string, appId: string) => void;
};
