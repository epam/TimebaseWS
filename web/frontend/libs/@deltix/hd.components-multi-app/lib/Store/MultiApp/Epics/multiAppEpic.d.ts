import { AnyAction } from 'redux';
import { ActionsObservable, StateObservable } from 'redux-observable';
import { IMultiAppState } from '../IMultiAppState';
import { createInputSource } from '../Model/createInputSource';
import { sharedResources } from '../Model/sharedResources';
import { CreateBundle } from '../Utils/CreateBundle';
/**
 * Listen "createEmbeddableAppAction" and run "sub" epic for requested application.
 *
 * This epic emmit embeddableAppCreatedAction when new application created.
 */
export declare const multiAppEpic: (shared: ReturnType<typeof sharedResources>, createInput: ReturnType<typeof createInputSource>, createBundle: ReturnType<typeof CreateBundle>) => (action$: ActionsObservable<AnyAction>, store$: StateObservable<IMultiAppState>) => import("rxjs").Observable<unknown>;
