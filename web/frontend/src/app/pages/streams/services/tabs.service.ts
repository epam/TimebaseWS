import { Injectable }    from '@angular/core';
import { select, Store } from '@ngrx/store';

import { Observable }                                    from 'rxjs';
import { distinctUntilChanged, filter, switchMap, take } from 'rxjs/operators';
import { AppState }                                      from '../../../core/store';
import { TabModel }                                      from '../models/tab.model';
import { getActiveTab }                                  from '../store/streams-tabs/streams-tabs.selectors';

@Injectable({
  providedIn: 'root',
})
export class TabsService {
  constructor(private appStore: Store<AppState>) {
  }

  activeTabOfSimilarComponent(): Observable<TabModel> {
    const activeTab$ = this.appStore.pipe(
      select(getActiveTab),
      filter(Boolean),
      distinctUntilChanged((current: TabModel, prev: TabModel) => current.id === prev.id),
    );

    return activeTab$.pipe(
      take(1),
      switchMap((firstTab: TabModel) => activeTab$.pipe(filter((tab: TabModel) => tab.type === firstTab.type))),
    );
  }
}
