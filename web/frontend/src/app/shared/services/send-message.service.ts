import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {mapTo} from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class SendMessageService {
  constructor(private httpClient: HttpClient) {}

  sendMessage(streamId: string, messages: object[], writeMode: string): Observable<void> {
    return this.httpClient
      .post(`/${encodeURIComponent(streamId)}/write`, messages, {
        params: {writeMode},
      })
      .pipe(mapTo(null));
  }
}
