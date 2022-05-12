import { AnyAction } from "redux";
/**
 * Add router metadata to action.
 */
export declare const ActionEnhancer: (appType: string, id: string) => (action: AnyAction) => {
    metadata: any;
    type: any;
};
export declare const IsActionOf: (appType: string, id: string) => (action: AnyAction) => boolean;
