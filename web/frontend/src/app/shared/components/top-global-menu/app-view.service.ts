import {Injectable} from '@angular/core';
import {Observable, ReplaySubject} from 'rxjs';
import {AppView} from './app-view';

@Injectable({
  providedIn: 'root',
})
export class AppViewService {
  private currentView$ = new ReplaySubject<AppView>(1);

  setCurrentView(view: AppView) {
    this.currentView$.next(view);
  }

  onCurrentView(): Observable<AppView> {
    return this.currentView$.asObservable();
  }
}
