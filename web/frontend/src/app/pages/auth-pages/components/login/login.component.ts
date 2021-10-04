import { AfterContentChecked, AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router }                                                                                  from '@angular/router';
import { select, Store }                                                                           from '@ngrx/store';

import { Observable, Subject }            from 'rxjs';
import { filter, map, take, takeUntil }   from 'rxjs/operators';
import { AppState }                       from '../../../../core/store';
import { GetAppInfo }                     from '../../../../core/store/app/app.actions';
import { getAppInfo }                     from '../../../../core/store/app/app.selectors';
import * as  AuthActions                  from '../../../../core/store/auth/auth.actions';
import { getAuthProvider, getIsLoggedIn } from '../../../../core/store/auth/auth.selectors';
import { AuthProviderModel }              from '../../../../models/auth-provider.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements AfterContentChecked, OnInit, AfterViewInit, OnDestroy {
  @ViewChild('usernameInput') usernameInput: ElementRef;
  
  username: string;
  password: string;
  authState$: Observable<AuthProviderModel>;
  showForm$: Observable<boolean>;
  version$: Observable<string>;
  
  private destroy$ = new Subject<any>();
  
  constructor(
    private router: Router,
    private appStore: Store<AppState>,
  ) { }
  
  ngOnInit(): void {
    this.authState$ = this.appStore.pipe(
      select(getAuthProvider),
      filter(authProvider => !!authProvider),
    );
    
    this.showForm$ = this.authState$.pipe(map(state => !!state?.custom_provider));
    this.version$ = this.appStore.pipe(select(getAppInfo)).pipe(map(info => info.version));
    this.appStore.dispatch(new GetAppInfo());
    
    this.authState$
      .pipe(
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe(authProvider => {
        if (!authProvider.custom_provider) {
          const hash = window.location.hash.substr(1).split('&');
          let code: string;
          for (const row of hash) {
            const [key, value] = row.split('=');
            if (key === 'code') {
              code = value;
              break;
            }
          }
          if (!code) {
            this.appStore.dispatch(new AuthActions.RedirectToAuthProvider());
          } else {
            this.appStore.dispatch(new AuthActions.ProcessSingInRedirect());
          }
        }
      });
    
    this.appStore
      .pipe(
        select(getIsLoggedIn),
        filter((isLoggedIn) => isLoggedIn),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.router.navigate(['/'], {replaceUrl: true});
      });
  }
  
  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
  
  ngAfterViewInit() {
    this.authState$
      .pipe(
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe(authProvider => {
        if (authProvider.custom_provider) {
          this.usernameInput.nativeElement.focus();
        }
      });
  }
  
  public login() {
    if (this.isValid()) {
      this.appStore.dispatch(new AuthActions.TryLogIn({
        password: this.password,
        username: this.username,
      }));
      
    }
  }
  
  public isValid() {
    return this.username != null && this.username.trim().length > 0 && this.password != null && this.password.trim().length;
  }
  
  ngAfterContentChecked() {
    this.isValid();
  }
  
}
