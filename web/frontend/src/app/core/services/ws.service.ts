import { Injectable }                               from '@angular/core';
import { RxStomp }                                  from '@stomp/rx-stomp';
import { Message, StompHeaders, StompSubscription } from '@stomp/stompjs';
import { Observable, Observer, Subscription }       from 'rxjs';
import { share }                                    from 'rxjs/operators';

@Injectable()
export class WSService extends RxStomp {
  public watch(destination: string, headers: StompHeaders = {}, unsubscribeHeaders?: StompHeaders): Observable<Message> {

    this._debug(`Request to subscribe ${destination}`);
    if (!headers.ack) {
      headers.ack = 'auto';
    }

    if (!unsubscribeHeaders) {
      unsubscribeHeaders = {
        destination: destination,
        ...headers,
      };
    }
    if (!unsubscribeHeaders.ack) {
      unsubscribeHeaders.ack = 'auto';
    }

    const coldObservable = Observable.create(
      (messages: Observer<Message>) => {
        let stompSubscription: StompSubscription;

        let stompConnectedSubscription: Subscription;
        stompConnectedSubscription = this.connected$.subscribe(() => {
          this._debug(`Will subscribe to ${destination}`);
          stompSubscription = this._stompClient.subscribe(destination, (message: Message) => {
              messages.next(message);
            },
            headers);
        });

        return () => {
          this._debug(`Stop watching connection state (for ${destination})`);
          stompConnectedSubscription.unsubscribe();

          if (this.connected()) {
            this._debug(`Will unsubscribe from ${destination} at Stomp`);
            stompSubscription.unsubscribe(unsubscribeHeaders);
          } else {
            this._debug(`Stomp not connected, no need to unsubscribe from ${destination} at Stomp`);
          }
        };
      });
    return coldObservable.pipe(share());
  }
}
