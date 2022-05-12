import * as React from "react";
import { IContainerMap } from "../MultiAppFacade";
import { IAppMap } from "../Store/MultiApp/IMultiAppState";
export interface IEmbeddableAppContext {
    roots: {
        [appType: string]: React.ComponentClass;
    };
    containers: IContainerMap;
    apps: IAppMap;
}
/**
 * Provide Root components of embeddable applications.
 */
export declare const EmbeddableRootsContext: React.Context<IEmbeddableAppContext>;
