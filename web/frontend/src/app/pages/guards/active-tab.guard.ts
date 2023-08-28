import { Injectable }                                                       from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { select, Store }                                                    from '@ngrx/store';
import { TranslateService }                                                 from '@ngx-translate/core';
import { combineLatest, Observable, of }                                    from 'rxjs';
import { filter, map, mapTo, switchMap, take, tap }                         from 'rxjs/operators';
import { AppState }                                                         from '../../core/store';
import {
  LoadTabsFromLS,
  UpdateTab,
}                                                                           from '../../pages/streams/store/streams-tabs/streams-tabs.actions';
import { MenuItemType }                                                     from '../../shared/models/menu-item';
import { MenuItemsService }                                                 from '../../shared/services/menu-items.service';
import { StorageService }                                                   from '../../shared/services/storage.service';
import { appRoute }                                                         from '../../shared/utils/routes.names';
import { getTabs }                                                          from '../streams/store/streams-tabs/streams-tabs.selectors';
import { StreamsNavigationService }                                         from '../streams/streams-navigation/streams-navigation.service';
import * as NotificationsActions
                                                                            from '../../core/modules/notifications/store/notifications.actions';

@Injectable({
  providedIn: 'root',
})
export class ActiveTabGuard implements CanActivate {
  constructor(
    private appStore: Store<AppState>,
    private router: Router,
    private storageService: StorageService,
    private menuItemsService: MenuItemsService,
    private streamsNavigationService: StreamsNavigationService,
    private translateService: TranslateService,
  ) {}
  
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    this.appStore.dispatch(new LoadTabsFromLS());
    if (!this.storageService.getTabs().length) {
      return this.tabNotFound(next);
    }
    
    return this.appStore.pipe(
      select(getTabs),
      filter((tabs) => !!tabs.length),
      switchMap((tabs) => {
        const currentActiveIndex = tabs.findIndex((tab) => tab.active);
        const activeIndex = tabs.findIndex((t) => t.id === next.params.id);
        
        if (activeIndex === -1) {
          return this.tabNotFound(next);
        }
        
        const update = [];
        
        if (currentActiveIndex > -1) {
          tabs[currentActiveIndex].active = false;
          update.push({
            tab: tabs[currentActiveIndex],
            position: currentActiveIndex,
          });
        }
        
        tabs[activeIndex].active = true;
        update.push({
          tab: tabs[activeIndex],
          position: activeIndex,
        });
        
        this.appStore.dispatch(new UpdateTab(update));
        
        return of(true);
      }),
    );
  }
  
  private tabNotFound(next: ActivatedRouteSnapshot): Observable<boolean> {
    const params = next.params;
    const stream$ = params.stream ?
      this.menuItemsService.getItems([`/${params.stream}/`], false, null, params.stream.endsWith('#view#')).pipe(map(r => r.children[0] || {})) :
      of({});
    
    return combineLatest([
      stream$,
      this.translateService.get('tabNotFoundWarning'),
    ]).pipe(tap(([stream, message]) => {
      const url = [appRoute, ...this.getUrl(next)];
      const queryParams = this.streamsNavigationService.params({
        meta: {
          symbol: params.symbol as string,
          stream: stream,
          isView: stream['type'] === MenuItemType.view,
          chartType: stream['chartType'],
        },
      }, '', true);
      
      this.appStore.dispatch(new NotificationsActions.AddWarn({message, closeInterval: 4000}));
      this.router.navigate(url, {queryParams});
    }), mapTo(false));
  }
  
  private getUrl(next: ActivatedRouteSnapshot) {
    const data = next.data;
    const typeAlias = (data) => ['view', 'reverse', 'live', 'monitor', 'chart'].find(key => data[key]);
    switch (true) {
      case data.view:
      case data.reverse:
      case data.live:
      case data.monitor:
      case data.chart:
        return [
          next.params.symbol ? 'symbol' : 'stream',
          typeAlias(data),
          next.params.stream,
          next.params.symbol,
        ].filter(Boolean);
      case data.orderBook:
        return ['order-book'];
      case data.query:
        return ['query'];
      case data.flow:
        return ['flow'];
      case data.schemaEdit:
        return ['stream', 'schema-edit', next.params.stream];
      case data.streamCreate:
        return ['stream', 'stream-create', next.params.stream];
    }
  }
}
