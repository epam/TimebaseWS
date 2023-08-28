import {Injectable, OnDestroy} from '@angular/core';
import { Store } from '@ngrx/store';
import {RxStomp, RxStompState} from '@stomp/rx-stomp';
import {Message, StompHeaders, StompSubscription} from '@stomp/stompjs';
import {Observable, Observer, Subscription, Subject, fromEvent} from 'rxjs';
import {map, share, filter, first, takeUntil} from 'rxjs/operators';
import * as NotificationsActions from 'src/app/core/modules/notifications/store/notifications.actions';
import { AppState } from '../store';

@Injectable()
export class WSService extends RxStomp implements OnDestroy {
  private destroy$ = new Subject();
  private notificationTime: number;
  private beforeUnload: boolean = false;
  private isTabActive: boolean = true;

  constructor(private appStore: Store<AppState>) {
    super();
    fromEvent(window, "beforeunload")
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.beforeUnload = true;
        this.appStore.dispatch(new NotificationsActions.RemoveNotification(1));
      });

    fromEvent(window, 'focus')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.isTabActive = true)

    fromEvent(window, 'blur')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.isTabActive = false)
  }

  public watch(
    destination: string,
    headers: StompHeaders = {},
    unsubscribeHeaders?: StompHeaders,
  ): Observable<Message> {
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

    const coldObservable = Observable.create((messages: Observer<Message>) => {
      let stompSubscription: StompSubscription;

      let stompConnectedSubscription: Subscription;
      stompConnectedSubscription = this.connected$.subscribe(() => {
        this.appStore.dispatch(
          new NotificationsActions.RemoveWebSocketNotifications(),
        );
        this._debug(`Will subscribe to ${destination}`);
        stompSubscription = this._stompClient.subscribe(
          destination,
          (message: Message) => {
            messages.next(message);
          },
          headers,
        );

        this.connectionState$
          .pipe(
            filter((currentState: RxStompState) => currentState === RxStompState.CLOSED && this.isTabActive && !document.hidden),
            first(),
            takeUntil(this.destroy$)
          )
          .subscribe(() => {
            stompSubscription = this._stompClient.subscribe(
              destination,
              (message: Message) => {
                messages.next(message);
              },
              headers,
            )

            if (!this.beforeUnload && (!this.notificationTime || Date.now() - this.notificationTime > 3000)) {
              this.appStore.dispatch(
                new NotificationsActions.AddWarn({
                  message: 'Websocket connection was closed unexpectedly',
                  dismissible: true,
                }),
              );
              this.notificationTime = Date.now();
            }
          }
        );
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

  watchObject<T>(
    destination: string,
    headers: StompHeaders = {},
    unsubscribeHeaders?: StompHeaders,
  ): Observable<T> {
    return this.watch(destination, headers, unsubscribeHeaders).pipe(
      map(({body}) => JSON.parse(body)),
    );
  }

  socketDisconnected() {
    return this.connectionState$.pipe(filter((currentState: RxStompState) => currentState === RxStompState.CLOSED));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
