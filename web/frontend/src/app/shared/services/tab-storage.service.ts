import { Injectable, OnDestroy }                         from '@angular/core';
import { ActivatedRoute }                                from '@angular/router';
import { StorageMap }                                                   from '@ngx-pwa/local-storage';
import { combineLatest, merge, Observable, of, ReplaySubject, Subject } from 'rxjs';
import {
  buffer,
  concatMap,
  distinctUntilChanged,
  filter,
  last,
  map, scan,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { ChartTypes }                                    from '../../pages/streams/models/chart.model';
import { TabModel }                                      from '../../pages/streams/models/tab.model';

@Injectable({
  providedIn: 'root',
})
export class TabStorageService<T> implements OnDestroy {
  snapShot: Partial<T>;
  private destroy$ = new ReplaySubject(1);
  private syncQueue$ = new Subject<[Observable<any>, Subject<any>]>();
  private dataUpdate$ = new Subject<Partial<T>>();
  private additionalKey: string;
  private clones: { [index: string]: TabStorageService<unknown> } = {};
  private syncFlowsInTab = {rightPanel: ['showMessageInfo', 'showProps', 'showViewInfo', 'messageView', 'showChartSettings', 'showDescription']};
  private syncConditions = {
    showViewInfo: (tab: TabModel) => tab.isView,
    showChartSettings: (tab: TabModel) => tab.filter?.chart_type === ChartTypes.LINEAR,
  };
  private localStorageStore = {rightPanel: ['showMessageInfo', 'showProps', 'showViewInfo', 'messageView', 'showChartSettings', 'showDescription']};
  
  constructor(private localStorage: StorageMap, private activatedRoute: ActivatedRoute) {
    this.syncQueue$
      .pipe(
        concatMap(([source$, resolve$]) =>
          source$.pipe(
            take(1),
            map((result) => ({result, resolve$})),
          ),
        ),
        tap(({result, resolve$}) => {
          resolve$.next(result);
          resolve$.complete();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
    this.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => (this.snapShot = data));
  }
  
  save(data: Partial<T>, doUpdate = true): Observable<boolean> {
    this.snapShot = data;
    return this.tabId().pipe(
      take(1),
      switchMap((tabId) => this.setByKey(this.key(tabId), data)),
      tap(() => {
        if (doUpdate) {
          this.dataUpdate$.next(data);
        }
      }),
    );
  }
  
  updateData(callback: (data: Partial<T>) => Partial<T>, doUpdate = true): Observable<boolean> {
    return this.getData().pipe(
      take(1),
      switchMap((data) => this.save(callback(data), doUpdate)),
    );
  }
  
  updateDataSync(callback: (data: Partial<T>) => Partial<T>): void {
    this.viaQueue(this.updateData(callback)).subscribe();
  }
  
  getDataSync(
    keys: string[] = null,
    getUpdates = true,
    ignoreLocalStorage = true,
  ): Observable<Partial<T>> {
    return this.viaQueue(this.getData(keys, getUpdates, ignoreLocalStorage));
  }
  
  getData(
    keys: string[] = null,
    getUpdates = true,
    ignoreLocalStorage = true,
  ): Observable<Partial<T>> {
    const data$ = this.tabId().pipe(
      switchMap((tabId) => {
        let getter = this.localStorage.get(this.key(tabId)) as Observable<Partial<T>>;
        if (
          !ignoreLocalStorage &&
          this.additionalKey &&
          this.localStorageStore[this.additionalKey]
        ) {
          const localValue = localStorage.getItem(this.key(tabId));
          getter = getter.pipe(startWith(localValue ? JSON.parse(localValue) : {}));
        }
        return merge(getter, this.dataUpdate$.pipe(filter(() => getUpdates)));
      }),
    );
    
    if (keys) {
      const uniqueStr = (data: Partial<T>) => {
        return JSON.stringify(keys.map((key) => (data ? data[key] : null)));
      };
      return data$.pipe(distinctUntilChanged((p, c) => uniqueStr(p) === uniqueStr(c)));
    }
    
    return data$;
  }
  
  removeData(tabId: string): Observable<boolean> {
    return this.localStorage
      .keys()
      .pipe(
        concatMap((key) =>
          key.startsWith(this.key(tabId)) ? this.deleteByKey(key) : of(undefined),
        ),
      );
  }
  
  removeAllData(): Observable<undefined> {
    return this.localStorage
      .keys()
      .pipe(
        concatMap((key) => (key.startsWith('tabsStorage') ? this.deleteByKey(key) : of(undefined))),
      );
  }
  
  replaceTab(from: TabModel, to: TabModel): Observable<boolean> {
    return this.localStorage.keys().pipe(
      concatMap((key) => {
        const syncFlow = Object.keys(this.syncFlowsInTab).find(
          (flow) => key === `tabsStorage${from.id}${flow}`,
        );
        
        if (syncFlow) {
          return this.localStorage.get(key).pipe(
            switchMap((data) => {
              const toSync = {};
              Object.keys(data)
                .filter((dataKey) => this.syncFlowsInTab[syncFlow].includes(dataKey))
                .forEach((dataKey) => {
                  if (!this.syncConditions[dataKey] || this.syncConditions[dataKey](to)) {
                    toSync[dataKey] = data[dataKey];
                  }
                });
              return this.setByKey(`tabsStorage${to.id}${syncFlow}`, toSync, syncFlow);
            }),
            concatMap(() => this.deleteByKey(key)),
          );
        }
        return key.startsWith(`tabsStorage${from.id}`) ? this.deleteByKey(key) : of(null);
      }),
      last(),
    );
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    Object.keys(this.clones).forEach(key => this.clones[key].ngOnDestroy());
  }
  
  flow<F>(key: string): TabStorageService<F> {
    if (!this.clones[key]) {
      this.clones[key] = new TabStorageService<F>(this.localStorage, this.activatedRoute);
      this.clones[key].setAdditionalKey(`${this.additionalKey || ''}${key}`);
    }
    
    return this.clones[key];
  }
  
  allDataForTab(tabId: string, ignoreKeys: RegExp[] = []): Observable<{[index: string]: unknown}> {
    const result = {};
    const keys = [];
    const tabKey = this.key(tabId);
    return this.localStorage.keys().pipe(
      tap(key => {
        if (key.startsWith(tabKey)) {
          const subKey = key.substr(tabKey.length);
          if (!ignoreKeys.find(regExp => regExp.test(subKey))) {
            keys.push(subKey);
          }
        }
      }),
      last(),
      switchMap(() => keys.length ? combineLatest(keys.map(k => this.localStorage.get(`${tabKey}${k}`))) : of([])),
      map((data) => {
        keys.forEach((k, i) => result[k] = data[i]);
        return result;
      }),
    );
  }
  
  setTabData(tabId: string, data: {[index: string]: unknown}): Observable<void> {
    const saves = Object.keys(data || {}).map(key => this.localStorage.set(`${this.key(tabId)}${key}`, data[key]));
    return saves.length ? combineLatest(saves) : of(null);
  }
  
  removeFlow(key: string): Observable<void> {
    return this.tabId().pipe(concatMap(tabId => this.localStorage.delete(this.flow(key).key(tabId)).pipe(tap(() => {
      delete this.clones[key];
    }))));
  }

  private tabId(): Observable<string> {
    return this.activatedRoute.params.pipe(map(({id}) => id));
  }
  
  private setAdditionalKey(key: string): void {
    this.additionalKey = key;
  }
  
  private key(tabId: string): string {
    return `tabsStorage${tabId}${this.additionalKey || ''}`;
  }
  
  private viaQueue(source$: Observable<any>): Observable<any> {
    const subject$ = new Subject<any>();
    this.syncQueue$.next([source$, subject$]);
    return subject$;
  }
  
  private setByKey(key: string, data: Partial<T>, flow = null): Observable<boolean> {
    const currentFlow = flow || this.additionalKey;
    if (currentFlow && this.localStorageStore[currentFlow]) {
      const localData = {};
      this.localStorageStore[currentFlow].forEach((k) => {
        if (data?.[k]) {
          localData[k] = data?.[k];
        }
      });
      
      localStorage.setItem(key, JSON.stringify(localData));
    }
    
    return this.localStorage.set(key, data);
  }
  
  private deleteByKey(key: string): Observable<boolean> {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
    }
    
    return this.localStorage.delete(key);
  }
}
