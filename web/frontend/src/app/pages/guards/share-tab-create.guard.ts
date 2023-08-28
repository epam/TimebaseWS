import {Injectable}                                                       from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {select, Store}                                                    from '@ngrx/store';
import { map, skip, switchMap, take }                                     from 'rxjs/operators';
import * as StreamsTabsActions                                            from '../../pages/streams/store/streams-tabs/streams-tabs.actions';
import {AppState}                                                         from '../../core/store';
import { TabStorageService }                                              from '../../shared/services/tab-storage.service';
import {appRoute}                                                         from '../../shared/utils/routes.names';
import {TabModel}                                                         from '../streams/models/tab.model';
import {LoadTabsFromLS}                                                   from '../streams/store/streams-tabs/streams-tabs.actions';
import {createTab}                                                        from '../streams/store/streams-tabs/streams-tabs.reducer';
import {getTabs}                                                          from '../streams/store/streams-tabs/streams-tabs.selectors';
import LZString                                                           from 'lz-string';

@Injectable({
  providedIn: 'root',
})
export class ShareTabCreateGuard implements CanActivate {
  constructor(
    private appStore: Store<AppState>,
    private router: Router,
    private tabStorageService: TabStorageService<unknown>,
  ) {}
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const shareTab = localStorage.getItem('shareTab');
    if (shareTab) {
      const shareTabData = JSON.parse(LZString.decompressFromEncodedURIComponent(shareTab));
      localStorage.removeItem('shareTab');
      this.appStore.pipe(
        select(getTabs),
        skip(1),
        take(1),
        switchMap(tabs => {
          const tab = createTab(tabs, new TabModel(shareTabData));
          return this.tabStorageService.setTabData(tab.id, shareTabData.storage).pipe(map(() => ({tab, tabs})));
        }),
      ).subscribe(({tabs, tab}) => {
        
        this.appStore.dispatch(
          new StreamsTabsActions.AddTab({
            tab,
            position: tabs.length,
          }),
        );

        this.router.navigate([`/${appRoute}`, ...tab.linkArray]);
      });
      this.appStore.dispatch(new LoadTabsFromLS());
    }

    return true;
  }
}
