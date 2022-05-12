import {
  AfterViewInit,
  Directive,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  Optional,
  SimpleChanges,
} from '@angular/core';
import {NavigationEnd, Router, RouterLinkWithHref} from '@angular/router';
import {ReplaySubject} from 'rxjs';
import {delay, filter, startWith, takeUntil, tap} from 'rxjs/operators';
import {StreamsNavigationService} from './streams-navigation.service';

@Directive({
  selector: '[appStreamsNavigationActive]',
})
export class StreamsNavigationActiveDirective implements AfterViewInit, OnDestroy, OnChanges {
  @Input() appStreamsNavigationActive: string;
  @HostBinding('class.active') private active: boolean;
  @HostBinding('class.router-link-disabled') private disabled: boolean;

  private destroy$ = new ReplaySubject(1);

  constructor(
    @Optional() private routerLinkWithHref: RouterLinkWithHref,
    private router: Router,
    private streamsNavigationService: StreamsNavigationService,
  ) {}

  ngAfterViewInit() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        startWith(null),
        takeUntil(this.destroy$),
        tap(() => this.checkActive()),
        delay(0),
      )
      .subscribe(() => this.checkActive());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.checkActive();
  }

  private checkActive() {
    this.active = this.streamsNavigationService.urlIsActive(this.routerLinkWithHref.href);
    this.disabled = this.routerLinkWithHref['commands'].length === 0;
  }
}
