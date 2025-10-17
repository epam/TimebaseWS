import { Injectable } from '@angular/core';
import { StompHeaders } from '@stomp/stompjs';
import { map } from 'rxjs/operators';
import { WSService } from 'src/app/core/services/ws.service';

@Injectable({
    providedIn: 'root',
})
export class TimebaseService {

    currentQuery: string;
    ddlIsUsing = false;

    constructor(private wsService: WSService) { }

    generateQQL(inputDDL: string, streamKeys: string[]) {
        const stompHeaders: StompHeaders = {
            userInput: inputDDL.replace(/\n/g, ' '),
            streamKeys: streamKeys.join(',')
        };

        return this.wsService.watch('/user/topic/genai-qql', stompHeaders).pipe(map((ws_message) => JSON.parse(ws_message.body)));
    }

    saveResult(key: string, value: string) {
        sessionStorage.setItem(key, value);
    }

    getSavedResult(key: string) {
        return JSON.parse(sessionStorage.getItem(key));
    }
}

export interface GenerateDDLResponce {
    errorMessage: string | null,
    resultDDL: string,
    resultIsNotValid: boolean
}
