import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {BehaviorSubject, fromEvent, Observable, of, Subject, timer} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
} from 'rxjs/operators';
import {AppInfoModel} from '../models/app.info.model';
import {ConnectionStatus} from '../models/connection-status';

@Injectable({
  providedIn: 'root',
})
export class CheckConnectionService {
  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>(ConnectionStatus.ok);
  private requestError$ = new Subject();
  private isOffline = false;

  constructor(private httpClient: HttpClient) {
    fromEvent(window, 'offline').subscribe(() => {
      this.connectionStatus$.next(ConnectionStatus.offline);
      this.isOffline = true;
    });

    fromEvent(window, 'online')
      .pipe(filter(() => this.connectionStatus$.getValue() === ConnectionStatus.offline))
      .subscribe(() => {
        this.isOffline = false;
        this.requestError();
      });

    this.requestError$
      .pipe(
        debounceTime(300),
        switchMap(() => this.ping()),
        switchMap((status) => {
          this.connectionStatus$.next(status);
          if (status !== ConnectionStatus.ok) {
            return this.pingUntilOk();
          }

          return of(null);
        }),
      )
      .subscribe(() => {
        if (this.connectionStatus$.getValue() !== ConnectionStatus.ok) {
          location.reload();
        }
        this.connectionStatus$.next(ConnectionStatus.ok);
      });
  }

  requestError() {
    this.requestError$.next();
  }

  connectionStatus(): Observable<ConnectionStatus> {
    return this.connectionStatus$.pipe(distinctUntilChanged());
  }

  private ping(): Observable<ConnectionStatus> {
    return this.httpClient
      .get('/v', {
        headers: {
          customError: 'true',
          connectionCheck: 'true',
        },
      })
      .pipe(
        map((response: AppInfoModel) =>
          response.timebase.connected
            ? ConnectionStatus.ok
            : ConnectionStatus.timebaseNotResponding,
        ),
        catchError(() =>
          of(this.isOffline ? ConnectionStatus.offline : ConnectionStatus.serverNotResponding),
        ),
      );
  }

  private pingUntilOk(): Observable<void> {
    return timer(5000).pipe(
      switchMap(() => this.ping()),
      switchMap((result) => (result === ConnectionStatus.ok ? of(null) : this.pingUntilOk())),
    );
  }
}
