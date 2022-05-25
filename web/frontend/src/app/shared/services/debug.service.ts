import {Injectable} from '@angular/core';
import {StorageMap} from '@ngx-pwa/local-storage';
import {fromEvent, of, Subject, timer} from 'rxjs';
import {bufferTime, concatMap, filter, map, take, takeUntil} from 'rxjs/operators';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DebugService {
  entered = '';
  private alias: string;
  private log$ = new Subject<object>();
  private end$ = new Subject<object>();

  constructor(private storageMap: StorageMap) {
    if (!environment.debug) {
      return;
    }
    this.storageMap
      .keys()
      .pipe(
        concatMap((key) =>
          key.startsWith('debug-') ? this.storageMap.delete(key) : of(undefined),
        ),
      )
      .subscribe();
  }

  start(alias: string) {
    if (!environment.debug) {
      return;
    }
    if (this.alias) {
      this.end(this.alias);
    }

    this.alias = alias;
    this.log$
      .pipe(
        bufferTime(300),
        filter((data) => !!data.length),
        takeUntil(this.end$),
        concatMap((data) =>
          this.storageMap.get(this.key()).pipe(
            take(1),
            map((storage: object[]) => (storage || []).concat(data)),
          ),
        ),
        concatMap((data) => this.storageMap.set(this.key(), data)),
      )
      .subscribe();

    fromEvent(document, 'keydown')
      .pipe(takeUntil(this.end$))
      .subscribe((event: KeyboardEvent) => {
        timer(5000).subscribe(() => (this.entered = ''));
        this.entered += event.key;
        if (this.entered === 'debug') {
          this.storageMap
            .get(this.key())
            .pipe(take(1))
            .subscribe((data) => {
              const src = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(data, null, '\t'),
              )}`;
              const a = document.createElement('a');
              a.innerText = 'Download';
              a.style.display = 'none';
              a.href = src;
              a.download = 'debug.json';
              document.body.appendChild(a);
              a.click();
            });
        }
      });
  }

  log(callback: () => object) {
    if (!environment.debug) {
      return;
    }
    this.log$.next({time: new Date().toISOString(), url: location.href, ...callback()});
  }

  end(alias: string) {
    if (!environment.debug) {
      return;
    }
    this.end$.next();
    this.storageMap.delete(this.key(alias)).subscribe();
  }

  private key(alias: string = null): string {
    return `debug-${alias || this.alias}`;
  }
}
