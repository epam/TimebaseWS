import {Injectable} from '@angular/core';
import {CanDeactivate} from '@angular/router';
import {Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs';
import {AppState} from '../../../../core/store';
import {SeLayoutComponent} from '../../modules/schema-editor/components/se-layout/se-layout.component';
import {OnCloseTabAlertService} from '../on-close-tab-alert.service';

@Injectable()
export class CheckShowingOnCloseAlertGuard implements CanDeactivate<SeLayoutComponent> {
  constructor(
    private appStore: Store<AppState>,
    private translate: TranslateService,
    private onCloseTabAlertService: OnCloseTabAlertService,
  ) {}

  canDeactivate(): Observable<boolean> {
    return this.onCloseTabAlertService.check();
  }
}
