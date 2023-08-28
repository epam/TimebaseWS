import { Injectable }            from '@angular/core';
import { Store }                 from '@ngrx/store';
import { TranslateService }      from '@ngx-translate/core';
import { switchMap }             from 'rxjs/operators';
import { AppState }              from '../../core/store';
import { TabModel }              from '../../pages/streams/models/tab.model';
import { copyToClipboard }       from '../utils/copy';
import { appRoute }              from '../utils/routes.names';
import LZString                  from 'lz-string';
import * as NotificationsActions from '../../core/modules/notifications/store/notifications.actions';

@Injectable({
  providedIn: 'root',
})
export class ShareLinkService {
  
  constructor(
    private translateService: TranslateService,
    private appStore: Store<AppState>,
  ) {}
  
  getShareUrl(tab: Partial<TabModel>) {
    const hash = LZString.compressToEncodedURIComponent(JSON.stringify(tab));
    return `${location.host}/${appRoute}?shareTab=${hash}`;
  }
  
  copyUrl(tab: Partial<TabModel>): void {
    return this.copyUrlByString(this.getShareUrl(tab));
  }
  
  copyUrlByString(url: string): void {
    copyToClipboard(url)
      .pipe(switchMap(() => this.translateService.get('shareLinkCopied')))
      .subscribe((message) => {
        this.appStore.dispatch(
          new NotificationsActions.AddNotification({
            message,
            dismissible: true,
            closeInterval: 1500,
            type: 'success',
          }),
        );
      });
  }
}
