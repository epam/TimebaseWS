import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';
import {AppView} from './app-view';
import {AppViewService} from './app-view.service';

@Injectable({
  providedIn: 'root',
})
export class AppViewGuard implements CanActivate {
  constructor(private appViewService: AppViewService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    this.appViewService.setCurrentView(route.url[0].path as AppView);
    return true;
  }
}
