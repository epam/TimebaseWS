import { Component, Input, OnInit }            from '@angular/core';
import { select, Store }                       from '@ngrx/store';
import { combineLatest, Observable }           from 'rxjs';
import { map }                                 from 'rxjs/operators';
import { AppState }                            from '../../../core/store';
import { TabSettingsModel }                    from '../../../pages/streams/models/tab.settings.model';
import { getActiveTab, getActiveTabSettings } from '../../../pages/streams/store/streams-tabs/streams-tabs.selectors';
import { TabStorageService }                   from '../../services/tab-storage.service';
import { HasRightPanel }                       from '../has-right-panel';

@Component({
  selector: 'app-right-toolbar',
  templateUrl: './right-toolbar.component.html',
  styleUrls: ['./right-toolbar.component.scss'],
})
export class RightToolbarComponent implements OnInit {
  @Input() tooltipPlacement = 'left';
  @Input() showProperties = true;
  @Input() showMessage = true;

  tabSettings$: Observable<TabSettingsModel>;
  showPropsActive$: Observable<boolean>;
  showMessageInfoActive$: Observable<boolean>;
  showPropsTooltip$: Observable<string>;
  showMessageTooltip$: Observable<string>;

  constructor(
    private appStore: Store<AppState>,
    private tabStorageService: TabStorageService<HasRightPanel>,
  ) {}

  ngOnInit(): void {
    this.tabSettings$ = this.appStore.pipe(select(getActiveTabSettings));
    this.showPropsActive$ = this.tabStorageService
      .flow('rightPanel')
      .getData(['showProps'], true, false)
      .pipe(map((data) => !!data?.showProps));

    this.showMessageInfoActive$ = this.tabStorageService
      .flow('rightPanel')
      .getData(['showMessageInfo'], true, false)
      .pipe(map((data) => !!data?.showMessageInfo));

    this.showPropsTooltip$ = combineLatest([
      this.appStore.pipe(select(getActiveTab)),
      this.showPropsActive$,
    ]).pipe(
      map(([tab, active]) => {
        if (!tab || active) {
          return null;
        }

        return `buttons.open_${tab.symbol ? 'symbol' : 'stream'}_properties`;
      }),
    );

    this.showMessageTooltip$ = this.showMessageInfoActive$.pipe(
      map((active) => (!active ? 'rightPanel.messageInfo' : null)),
    );
  }

  toggleProps() {
    this.tabStorageService.flow('rightPanel').updateDataSync((data) => ({
      ...data,
      showMessageInfo: false,
      showProps: !data?.showProps,
    }));
  }

  toggleMessageInfo() {
    this.tabStorageService.flow('rightPanel').updateDataSync((data) => ({
      ...data,
      showMessageInfo: !data?.showMessageInfo,
      showProps: false,
    }));
  }
}
