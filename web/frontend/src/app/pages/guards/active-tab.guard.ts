import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {AppState} from '../../core/store';
import {
  LoadTabsFromLS,
  UpdateTab,
} from '../../pages/streams/store/streams-tabs/streams-tabs.actions';
import {StorageService} from '../../shared/services/storage.service';
import {getTabs} from '../streams/store/streams-tabs/streams-tabs.selectors';

@Injectable({
  providedIn: 'root',
})
export class ActiveTabGuard implements CanActivate {
  constructor(
    private appStore: Store<AppState>,
    private router: Router,
    private storageService: StorageService,
  ) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    this.appStore.dispatch(new LoadTabsFromLS());
    if (!this.storageService.getTabs().length) {
      this.router.navigateByUrl('/');
    }

    return this.appStore.pipe(
      select(getTabs),
      filter((tabs) => !!tabs.length),
      map((tabs) => {
        const currentActiveIndex = tabs.findIndex((tab) => tab.active);
        const activeIndex = tabs.findIndex((t) => t.id === next.params.id);

        if (activeIndex === -1) {
          this.router.navigateByUrl('/');
          return;
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

        return true;
      }),
    );
  }
}
