import { Component, Input, OnInit } from '@angular/core';
import { select, Store }            from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take }  from 'rxjs/operators';
import { AppState }   from '../../../../core/store';
import { TabSettingsModel }     from '../../models/tab.settings.model';
import * as StreamsTabsActions  from '../../store/streams-tabs/streams-tabs.actions';
import { getActiveTabSettings } from '../../store/streams-tabs/streams-tabs.selectors';

@Component({
  selector: 'app-stream-right-toolbar',
  templateUrl: './stream-right-toolbar.component.html',
  styleUrls: ['./stream-right-toolbar.component.scss'],
})
export class StreamRightToolbarComponent implements OnInit {
  
  @Input() tooltipPlacement = 'left';
  
  tabSettings$: Observable<TabSettingsModel>;
  active$: Observable<boolean>;
  
  constructor(
    private appStore: Store<AppState>,
  ) { }

  ngOnInit(): void {
    this.tabSettings$ = this.appStore.pipe(select(getActiveTabSettings));
    this.active$ = this.tabSettings$.pipe(map(settings => settings.showProps));
  }
  
  toggleDetails() {
    this.tabSettings$.pipe(take(1)).subscribe(settings => {
      const payload = settings.showProps ? {showProps: false} : {showProps: true, showMessageInfo: false};
        this.appStore.dispatch(new StreamsTabsActions.SetTabSettings({
          tabSettings: {...settings, ...payload },
        }));
    });
  }
}
