import { Component, OnInit }      from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store }          from '@ngrx/store';
import { take }                   from 'rxjs/operators';
import { AppState }               from '../../../core/store';
import { TabModel }               from '../../../pages/streams/models/tab.model';
import * as StreamsTabsActions    from '../../../pages/streams/store/streams-tabs/streams-tabs.actions';
import { LoadTabsFromLS }         from '../../../pages/streams/store/streams-tabs/streams-tabs.actions';
import { createTab }              from '../../../pages/streams/store/streams-tabs/streams-tabs.reducer';
import { getTabs }                from '../../../pages/streams/store/streams-tabs/streams-tabs.selectors';
import { TabStorageService }      from '../../services/tab-storage.service';
import { appRoute }               from '../../utils/routes.names';

@Component({
  selector: 'app-tabs-router-proxy',
  template: '',
  providers: [TabStorageService],
})
export class TabsRouterProxyComponent implements OnInit {
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private appStore: Store<AppState>,
    private tabStorageService: TabStorageService<unknown>,
  ) {}

  ngOnInit() {
    this.appStore.dispatch(new LoadTabsFromLS());
    this.appStore.pipe(select(getTabs), take(1)).subscribe((tabs) => {
      const activeIndex = tabs.findIndex((tab) => tab.active);
      const queryParams = this.activatedRoute.snapshot.queryParams;
      let newTab = activeIndex === -1 ? true : queryParams.newTab;
      if (!newTab) {
        newTab = tabs[activeIndex].query || tabs[activeIndex].flow || tabs[activeIndex].orderBook;
      }

      const tab = createTab(
        tabs,
        new TabModel({
          ...this.activatedRoute.snapshot.queryParams,
          ...this.activatedRoute.snapshot.params,
          ...(this.activatedRoute.snapshot.data || {}),
          active: true,
        }),
      );

      Object.keys(queryParams).forEach((key) => {
        if (key.startsWith('tabFilters:')) {
          tab.filter[key.split(':')[1]] = queryParams[key];
        }
      });

      if (!newTab) {
        this.tabStorageService
          .replaceTab(tabs[activeIndex].id, tab.id)
          .pipe(take(1))
          .subscribe(() => {
            this.appStore.dispatch(
              new StreamsTabsActions.UpdateTab([
                {
                  tab: tab,
                  position: activeIndex,
                },
              ]),
            );
          });
      } else {
        this.appStore.dispatch(
          new StreamsTabsActions.AddTab({
            tab,
            position: tabs.length,
          }),
        );
      }

      this.router.navigate([appRoute, ...tab.linkArray], {
        queryParams: tab.linkQuery,
      });
    });
  }
}
