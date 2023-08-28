import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import { editedMessageProps } from 'src/app/pages/streams/components/modals/modal-send-message/modal-send-message.component';

@Injectable({providedIn: 'root'})
export class StreamMessageService {
  constructor(private httpClient: HttpClient) {}

  sendMessage(
    streamId: string,
    messages: object[],
    writeMode: string,
  ): Observable<{error: string; message: string}[]> {
    return this.httpClient.post<{error: string; message: string}[]>(
      `/${encodeURIComponent(streamId)}/write`,
      messages,
      {
        params: {writeMode},
      },
    );
  }

  updateMessage(
    streamId: string,
    updatedMessage: object,
    messageInfo: editedMessageProps,
  ): Observable<{error: string; message: string}[]> {
    const params = {};
    Object.keys(messageInfo).forEach(key => {
      if (messageInfo[key] !== null && messageInfo[key] !== undefined) {
        params[key] = messageInfo[key];
      }
    })
    return this.httpClient.post<{error: string; message: string}[]>(
      `/${encodeURIComponent(streamId)}/update`,
      updatedMessage,
      { params },
    )
  }
}
