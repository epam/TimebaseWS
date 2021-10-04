import { Injectable } from '@angular/core';
import * as Rx        from 'rxjs';
import { Subject }    from 'rxjs';

export interface Message {
  author: string;
  message: string;
}

@Injectable()
export class WebsocketService {

  public ws: any;
  public messages: Subject<Message>;

  constructor() { }

  private subject: Rx.Subject<MessageEvent>;


  public connect(url: string, dataObj: Object): Rx.Subject<MessageEvent> {
    if (!this.subject) {
      this.subject = this.create(url, dataObj);
      // console.log('Successfully connected: ' + url);
    }
    return this.subject;
  }


  public send(dataObj) {
    this.ws.send(JSON.stringify(dataObj));
  }

  private create(url: string, dataObj: Object): Rx.Subject<MessageEvent> {
    this.ws = new WebSocket(url);
    const observable = Rx.Observable.create(
      (obs: Rx.Observer<MessageEvent>) => {
        this.ws.onmessage = obs.next.bind(obs);
        this.ws.onerror = obs.error.bind(obs);
        this.ws.onopen = () => {
            this.ws.send(JSON.stringify(dataObj));

        };
        this.ws.onclose = obs.complete.bind(obs);
        return this.ws.close.bind(this.ws);
      });
    const observer = {
      // Don't used
      next: (data: Object) => {
        if (this.ws.readyState === 1) {
          this.ws.send(JSON.stringify(data));
        }
      },
    };

    return Rx.Subject.create(observer, observable);

  }

  public close() {
    if (this.ws) {
      this.ws.close();
      this.subject = null;
    }
  }

}
