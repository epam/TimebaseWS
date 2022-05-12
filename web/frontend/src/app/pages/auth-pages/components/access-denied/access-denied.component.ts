import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../core/store';
import * as AuthActions from '../../../../core/store/auth/auth.actions';

@Component({
  selector: 'app-access-denied',
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss'],
})
export class AccessDeniedComponent implements OnInit {
  constructor(private appStore: Store<AppState>) {}

  ngOnInit() {}

  public onLogout(): void {
    this.appStore.dispatch(new AuthActions.LogOut());
  }
}
