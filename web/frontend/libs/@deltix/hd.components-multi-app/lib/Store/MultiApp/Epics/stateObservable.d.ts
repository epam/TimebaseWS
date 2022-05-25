import { Observable } from 'rxjs';
export declare class FixedStateObservable<T = any> extends Observable<T> {
    private __notifier;
    private __subscription;
    private __value;
    private __path;
    constructor(stateSubject: Observable<T>, initialState: T, appType: string, appId: string);
    get value(): any;
}
