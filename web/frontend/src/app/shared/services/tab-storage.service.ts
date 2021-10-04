import { Injectable, OnDestroy } from '@angular/core';
import { StorageMap } from '@ngx-pwa/local-storage';
import { merge, Observable, of, ReplaySubject, Subject }                         from 'rxjs';
import { concatMap, distinctUntilChanged, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { ActivatedRoute }                                                        from '@angular/router';

@Injectable()
export class TabStorageService<T> implements OnDestroy {
  private destroy$ = new ReplaySubject(1);
  private syncQueue$ = new Subject<[Observable<any>, Subject<any>]>();
  private dataUpdate$ = new Subject<Partial<T>>();

  constructor(
    private localStorage: StorageMap,
    private activatedRoute: ActivatedRoute,
  ) {
    this.syncQueue$.pipe(
      concatMap(([source$, resolve$]) => source$.pipe(take(1), map(result => ({ result, resolve$ })))),
      tap(({ result, resolve$ }) => {
        resolve$.next(result);
        resolve$.complete();
      }),
      takeUntil(this.destroy$),
    ).subscribe();
  }

  save(data: Partial<T>): Observable<boolean> {
    return this.tabId().pipe(
      take(1),
      switchMap(tabId => this.localStorage.set(this.key(tabId), data)),
      tap(() => this.dataUpdate$.next(data)),
    );
  }

  updateData(callback: (data: Partial<T>) => Partial<T>): Observable<boolean> {
    return this.getData().pipe(
      take(1),
      switchMap(data => this.save(callback(data))),
    );
  }

  updateDataSync(callback: (data: Partial<T>) => Partial<T>): void {
    this.viaQueue(this.updateData(callback)).subscribe();
  }

  getDataSync(): Observable<Partial<T>> {
    return this.viaQueue(this.getData());
  }

  getData(keys: string[] = null): Observable<Partial<T>> {
    const data$ = this.tabId().pipe(switchMap(tabId => merge(
      this.localStorage.get(this.key(tabId)) as Observable<Partial<T>>,
      this.dataUpdate$,
    )));
    
    if (keys) {
      const uniqueStr = (data: Partial<T>) => {
        return JSON.stringify(keys.map(key => data ? data[key] : null));
      };
      return data$.pipe(distinctUntilChanged((p, c) => uniqueStr(p) === uniqueStr(c)));
    }
    
    return data$;
  }

  removeData(tabId: string): Observable<boolean> {
    return this.localStorage.delete(this.key(tabId));
  }

  removeAllData(): Observable<undefined> {
    return this.localStorage.keys().pipe(
      concatMap(key => key.startsWith('tabsStorage') ? this.localStorage.delete(key) : of(undefined)),
    );
  }

  private tabId(): Observable<string> {
    return this.activatedRoute.params.pipe(map(({ id }) => id));
  }

  private key(tabId: string): string {
    return `tabsStorage${tabId}`;
  }

  private viaQueue(source$: Observable<any>): Observable<any> {
    const subject$ = new Subject<any>();
    this.syncQueue$.next([source$, subject$]);
    return subject$;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
