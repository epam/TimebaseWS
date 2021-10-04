import { Component, OnInit }   from '@angular/core';
import { ActivatedRoute }      from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState }            from '../../../core/store';
import * as StreamsTabsActions from '../../../pages/streams/store/streams-tabs/streams-tabs.actions';

@Component({
  selector: 'app-tabs-router-proxy',
  template: '',
})
export class TabsRouterProxyComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private appStore: Store<AppState>,
  ) { }

  ngOnInit() {
    this.appStore.dispatch(new StreamsTabsActions.CreateTab({
      params: this.route.snapshot.params,
      data: {
        ...(this.route.snapshot.data || {}),
        ...(this.route.snapshot.queryParams || {}),
      },
    }));
  }
}
