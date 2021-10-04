import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { filter, map } from 'rxjs/operators';
import * as StreamsTabsActions from '../../pages/streams/store/streams-tabs/streams-tabs.actions';
import { AppState } from '../../core/store';
import { StorageService } from '../../shared/services/storage.service';
import { LoadTabsFromLS } from '../../pages/streams/store/streams-tabs/streams-tabs.actions';
import { getTabs } from '../streams/store/streams-tabs/streams-tabs.selectors';

@Injectable({
  providedIn: 'root',
})
export class ActiveTabGuard implements CanActivate {
  constructor(
    private appStore: Store<AppState>,
    private storageService: StorageService,
  ) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    this.appStore.dispatch(new LoadTabsFromLS());
    return this.appStore.pipe(
      select(getTabs),
      filter(tabs => !!tabs.length),
      map(tabs => {
        const activeIndex = tabs.findIndex(t => t.id === next.params.id);
        this.appStore.dispatch(new StreamsTabsActions.AddTab({
          tab: tabs[activeIndex],
          position: activeIndex,
        }));

        this.storageService.setPreviousActiveTab(tabs[activeIndex]);
        return true;
      }),
    );
  }

}
