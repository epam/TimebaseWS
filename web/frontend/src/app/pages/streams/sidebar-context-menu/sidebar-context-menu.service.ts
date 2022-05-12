import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {MenuItem} from '../../../shared/models/menu-item';

@Injectable()
export class SidebarContextMenuService {
  private openMenu$ = new Subject<{event: MouseEvent; item: MenuItem}>();
  private closeMenu$ = new Subject<void>();
  private menuWasClosed$ = new Subject<void>();

  constructor() {}

  openMenu(event: MouseEvent, item: MenuItem) {
    this.openMenu$.next({event, item});
  }

  onOpenMenu(): Observable<{event: MouseEvent; item: MenuItem}> {
    return this.openMenu$.asObservable();
  }

  closeMenu() {
    this.closeMenu$.next();
  }

  onCloseMenu(): Observable<void> {
    return this.closeMenu$.asObservable();
  }

  menuWasClosed() {
    this.menuWasClosed$.next();
  }

  onMenuWasClosed(): Observable<void> {
    return this.menuWasClosed$.asObservable();
  }
}
