import { Injectable }            from '@angular/core';
import { select, Store }         from '@ngrx/store';
import { TranslateService }      from '@ngx-translate/core';
import { Observable, of, timer } from 'rxjs';
import {
  map,
  switchMap,
  take,
  tap,
}                                from 'rxjs/operators';
import { AppState }              from '../../../core/store';
import { ConfirmModalService }   from '../../../shared/components/modals/modal-on-close-alert/confirm-modal.service';
import { TabModel }              from '../models/tab.model';
import { TabSettingsModel }      from '../models/tab.settings.model';
import { SetTabSettings }        from '../store/streams-tabs/streams-tabs.actions';
import {
  getActiveTabSettings,
  needToShowOnCloseAlertTabs,
}                                from '../store/streams-tabs/streams-tabs.selectors';

@Injectable({
  providedIn: 'root',
})
export class OnCloseTabAlertService {
  private withoutAlert = false;
  
  constructor(
    private appStore: Store<AppState>,
    private translate: TranslateService,
    private confirmModalService: ConfirmModalService,
  ) {
  }
  
  check(tab: TabModel = null): Observable<boolean> {
    return this.needAlertTabs()
      .pipe(
        take(1),
        switchMap(tabs => {
          const needToShow = (tab && tabs.some(t => t.id === tab.id)) || (!tab && tabs.length);
          return needToShow && !this.withoutAlert ?
            this.confirmModalService.confirm('notification_messages.onbeforeunloadMessage') :
            of(true);
        }));
  }
  
  doWithoutAlert(): Observable<boolean> {
    this.withoutAlert = true;
    return of(null).pipe(tap(() => timer().subscribe(() => this.withoutAlert = false)));
  }
  
  isActiveTabNeedToCloseAlert(): Observable<boolean> {
    return this.needAlertTabs().pipe(map(tabs => tabs.some(tab => tab.active)));
  }
  
  private needAlertTabs(): Observable<TabModel[]> {
    return this.appStore.pipe(select(needToShowOnCloseAlertTabs));
  }
  
  resetNeedShowAlert() {
    this.appStore.pipe(select(getActiveTabSettings))
      .pipe(
        take(1),
      ).subscribe((activeTabSettings: TabSettingsModel) => {
      const tabSettings = {...activeTabSettings};
      delete tabSettings._showOnCloseAlerts;
      this.appStore.dispatch(new SetTabSettings({tabSettings}));
    });
  }
}
