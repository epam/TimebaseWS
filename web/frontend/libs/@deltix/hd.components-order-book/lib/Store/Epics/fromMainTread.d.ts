import { AnyAction } from "redux";
import { ActionsObservable } from "redux-observable";
export declare const fromMainTread: (channel: string) => ActionsObservable<AnyAction>;
