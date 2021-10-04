import { AfterViewInit, Directive, HostBinding, OnDestroy, Optional } from '@angular/core';
import { NavigationEnd, Router, RouterLinkWithHref } from '@angular/router';
import { delay, filter, startWith, takeUntil, tap } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs';
import * as Url from 'url';

@Directive({
  selector: '[appStreamsNavigationActive]',
})
export class StreamsNavigationActiveDirective implements  AfterViewInit, OnDestroy {

  @HostBinding('class.active') private active: boolean;
  @HostBinding('class.router-link-disabled') private disabled: boolean;

  private destroy$ = new ReplaySubject(1);

  constructor(
    @Optional() private routerLinkWithHref: RouterLinkWithHref,
    private router: Router,
    ) { }

  ngAfterViewInit() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      takeUntil(this.destroy$),
      tap(() => this.checkActive()),
      delay(0),
    ).subscribe(() => this.checkActive());
  }

  private checkActive() {
    const [routerUrl, routerParams] = this.parseUrl(this.router.routerState.snapshot.url);
    const [itemUrl, itemParams] = this.parseUrl(this.routerLinkWithHref.href);
    this.disabled = this.routerLinkWithHref['commands'].length === 0;
    this.active = routerUrl.startsWith(`${itemUrl}/`) && JSON.stringify(routerParams) === JSON.stringify(itemParams);
  }

  private parseUrl(urlString: string): [string, object] {
    const [url, paramsString] = urlString.split('?');
    const params = {};
    new URLSearchParams(paramsString).forEach((value, key) => params[key] = value);
    return [url, params];
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
