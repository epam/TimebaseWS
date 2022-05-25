import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {StorageMap} from '@ngx-pwa/local-storage';
import {BsModalService} from 'ngx-bootstrap/modal';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {AppState} from '../../../core/store';
import * as AuthActions from '../../../core/store/auth/auth.actions';
import {ModalSettingsComponent} from '../../../pages/streams/components/modals/modal-settings/modal-settings.component';
import * as fromStreamDetails from '../../../pages/streams/store/stream-details/stream-details.reducer';
import {GlobalFiltersService} from '../../services/global-filters.service';
import {AppView} from './app-view';
import {AppViewService} from './app-view.service';

@Component({
  selector: 'app-top-global-menu',
  templateUrl: './top-global-menu.component.html',
  styleUrls: ['./top-global-menu.component.scss'],
})
export class TopGlobalMenuComponent implements OnInit {
  timezone$: Observable<string>;
  globalFiltersHasChanges$: Observable<boolean>;
  currentView$: Observable<AppView>;

  constructor(
    private appStore: Store<AppState>,
    private modalService: BsModalService,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
    private globalFiltersService: GlobalFiltersService,
    private appViewService: AppViewService,
    private storageMap: StorageMap,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.timezone$ = this.globalFiltersService
      .getFilters()
      .pipe(map((filters) => filters.timezone[0].name));
    this.globalFiltersHasChanges$ = this.globalFiltersService.hasChanges();
    this.currentView$ = this.appViewService.onCurrentView();
  }

  openGlobalSettings() {
    const initialState = {
      title: 'Global Settings',
      closeBtnName: 'Close',
    };

    this.modalService.show(ModalSettingsComponent, {initialState});
  }

  onLogOut() {
    this.appStore.dispatch(new AuthActions.LogOut());
  }

  onChangeView(value: AppView) {
    if (value === AppView.DASHBOARD) {
      this.storageMap.set('last-app-route', this.router.url).subscribe(() => {
        this.router.navigateByUrl(AppView.DASHBOARD);
      });
    } else {
      this.storageMap.get('last-app-route').subscribe((url: string) => {
        this.router.navigateByUrl(url || 'app');
      });
    }
  }
}
