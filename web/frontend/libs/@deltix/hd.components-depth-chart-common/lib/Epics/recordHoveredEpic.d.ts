import { Action } from 'redux';
import { Observable } from 'rxjs';
export declare const recordHoveredEpic: (action$: Observable<Action>) => Observable<{
    type: string;
    payload: {
        groupId: string;
        side: import("@deltix/hd.components-order-book").L2MessageSide;
        entity: any;
    };
}>;
