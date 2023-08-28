import { Component, Input, OnInit }           from '@angular/core';
import { select, Store }                      from '@ngrx/store';
import { combineLatest, Observable }          from 'rxjs';
import { map }                                from 'rxjs/operators';
import { AppState }                           from '../../../core/store';
import { ChartTypes }                         from '../../../pages/streams/models/chart.model';
import { TabSettingsModel }                   from '../../../pages/streams/models/tab.settings.model';
import { getActiveTab, getActiveTabSettings } from '../../../pages/streams/store/streams-tabs/streams-tabs.selectors';
import { TabStorageService }                  from '../../services/tab-storage.service';
import { HasRightPanel }                      from '../has-right-panel';
import { RightPaneService }                   from '../right-pane.service';

@Component({
  selector: 'app-right-toolbar',
  templateUrl: './right-toolbar.component.html',
  styleUrls: ['./right-toolbar.component.scss'],
})
export class RightToolbarComponent implements OnInit {
  @Input() tooltipPlacement = 'left';
  @Input() tabHasStream = true;
  @Input() showMessage = true;

  tabSettings$: Observable<TabSettingsModel>;
  showPropsActive$: Observable<boolean>;
  showMessageInfoActive$: Observable<boolean>;
  showDescriptionActive$: Observable<boolean>;
  showPropsTooltip$: Observable<string>;
  showMessageTooltip$: Observable<string>;
  showDescriptionTooltip$: Observable<string>;
  showViewInfoTooltip$: Observable<string>;
  showViewProperties$: Observable<boolean>;
  chartSettingsActive$: Observable<boolean>;
  showChartSettings$: Observable<boolean>;

  constructor(
    private appStore: Store<AppState>,
    private tabStorageService: TabStorageService<HasRightPanel>,
    private rightPaneService: RightPaneService,
  ) {}

  ngOnInit(): void {
    this.tabSettings$ = this.appStore.pipe(select(getActiveTabSettings));
    this.showPropsActive$ = this.rightPaneService.onShowProps();
    this.showMessageInfoActive$ = this.rightPaneService.onShowSelectedMessage();
    this.chartSettingsActive$ = this.rightPaneService.onShowChartSettings();
    this.showDescriptionActive$ = this.rightPaneService.onShowDescription();

    this.showPropsTooltip$ = combineLatest([
      this.appStore.pipe(select(getActiveTab)),
      this.showPropsActive$,
    ]).pipe(
      map(([tab, active]) => {
        if (!tab || active) {
          return null;
        }

        return `buttons.open_${tab.symbol ? 'symbol' : tab.isView ? 'view' : 'stream'}_properties`;
      }),
    );
    
    const tooltip = (observable$, translation) => observable$.pipe(
      map((active) => (!active ? translation : null)),
    );

    this.showMessageTooltip$ = tooltip(this.showMessageInfoActive$, 'rightPanel.messageInfo');
    this.showDescriptionTooltip$ = tooltip(this.showDescriptionActive$, 'rightPanel.description');
    
    this.showViewProperties$ = this.appStore.pipe(select(getActiveTab)).pipe(map(tab => !!tab?.isView));
    this.showChartSettings$ = this.appStore.pipe(select(getActiveTab)).pipe(map(tab => tab?.filter?.chart_type === ChartTypes.LINEAR));
  }

  toggleProps() {
    this.rightPaneService.toggleProp('showProps');
  }
  
  toggleViewDetails() {
    this.rightPaneService.toggleProp('showViewInfo');
  }

  toggleMessageInfo() {
    this.rightPaneService.toggleProp('showMessageInfo');
  }
  
  toggleChartSettings() {
    this.rightPaneService.toggleProp('showChartSettings');
  }
  
  toggleDescription() {
    this.rightPaneService.toggleProp('showDescription');
  }
}
