import { Action } from 'redux';
import { Observable } from 'rxjs';
export declare const noHoveredRecordsEpic: (action$: Observable<Action>) => Observable<{
    type: string;
    payload: {
        groupId: string;
    };
}>;
