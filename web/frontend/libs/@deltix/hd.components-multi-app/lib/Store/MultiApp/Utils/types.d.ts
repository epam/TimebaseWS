import { AnyAction } from "redux";
import { ActionsObservable, Epic, StateObservable } from "redux-observable";
import { IMultiAppState } from "../IMultiAppState";
import { createEmbeddableAppAction } from "../multiAppActions";
export declare type AnyEpic = Epic<any, any>;
export declare type ActionStream = ActionsObservable<AnyAction>;
export declare type StateStream = StateObservable<IMultiAppState>;
export declare type CreateEmbeddableAppAction = ReturnType<typeof createEmbeddableAppAction>;
