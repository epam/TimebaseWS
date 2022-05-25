import {CdkDragMove, moveItemInArray} from '@angular/cdk/drag-drop';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {ContextMenuComponent} from 'ngx-contextmenu';

import {PerfectScrollbarComponent, PerfectScrollbarConfigInterface} from 'ngx-perfect-scrollbar';
import {interval, Observable, Subject} from 'rxjs';
import {
  delay,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  take,
  takeUntil,
  takeWhile,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import {AppState} from '../../../../core/store';
import {ContextMenuControlService} from '../../../../shared/services/context-menu-control.service';
import {GlobalFiltersService} from '../../../../shared/services/global-filters.service';
import {StorageService} from '../../../../shared/services/storage.service';
import {StreamsService} from '../../../../shared/services/streams.service';
import {appRoute} from '../../../../shared/utils/routes.names';

import {TabModel} from '../../models/tab.model';
import {TabSettingsModel} from '../../models/tab.settings.model';
import {OnCloseTabAlertService} from '../../services/on-close-tab-alert.service';
import {StreamRenameService} from '../../services/stream-rename.service';
import {StreamUpdatesService} from '../../services/stream-updates.service';
import * as StreamDetailsActions from '../../store/stream-details/stream-details.actions';
import * as fromStreamDetails from '../../store/stream-details/stream-details.reducer';

import * as fromStreams from '../../store/streams-list/streams.reducer';
import * as StreamsTabsActions from '../../store/streams-tabs/streams-tabs.actions';
import {RemoveTab, RemoveTabs, UpdateTab} from '../../store/streams-tabs/streams-tabs.actions';

import {
  getActiveTab,
  getActiveTabSettings,
  getTabsState,
} from '../../store/streams-tabs/streams-tabs.selectors';

@Component({
  selector: 'app-streams-tabs',
  templateUrl: './streams-tabs.component.html',
  styleUrls: ['./streams-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamsTabsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(PerfectScrollbarComponent) scrollBarComponent?: PerfectScrollbarComponent;
  @ViewChildren('tabEl') tabElements: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('tabsScrollBar', {read: ElementRef}) tabsScrollBarEl: ElementRef<HTMLElement>;
  @ViewChild('tabsScrollBar') tabsScrollBar: PerfectScrollbarComponent;
  @ViewChild(ContextMenuComponent) tabsContextMenu: ContextMenuComponent;

  propsState: Observable<fromStreams.State>;
  config: PerfectScrollbarConfigInterface = {};
  openTabsList: boolean;
  live: boolean;
  tabSettings$: Observable<TabSettingsModel>;
  tabSettings: TabSettingsModel = {};
  tabs$: Observable<TabModel[]>;
  tabMoving: boolean;

  private onbeforeunloadMessage: string;
  private destroy$ = new Subject();
  private dragElDelta = {left: 0, right: 0};
  private scrollingOnMove = {
    left: {state: false, stop$: new Subject<void>()},
    right: {state: false, stop$: new Subject<void>()},
  };

  constructor(
    private appStore: Store<AppState>,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
    private translate: TranslateService,
    private storageService: StorageService,
    private onCloseTabAlertService: OnCloseTabAlertService,
    private globalSettingsService: GlobalFiltersService,
    private streamUpdatesService: StreamUpdatesService,
    private streamRenameService: StreamRenameService,
    private contextMenuControlService: ContextMenuControlService,
  ) {}

  ngOnInit() {
    this.tabSettings$ = this.appStore.pipe(select(getActiveTabSettings));
    this.tabSettings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((settings: TabSettingsModel) => (this.tabSettings = settings));
    this.streamDetailsStore.dispatch(new StreamDetailsActions.SetGlobalFilterState());

    this.tabs$ = this.appStore.pipe(
      select(getTabsState),
      map((state) => state.tabs),
      tap(() => this.scrollBarComponent?.directiveRef?.update()),
    );

    this.activatedRoute.queryParams.subscribe((params: Params) => {
      this.live = params.hasOwnProperty('live');
    });

    this.navigateFromRoot();

    this.onCloseTabAlertService
      .isActiveTabNeedToCloseAlert()
      .pipe(
        withLatestFrom(this.translate.get('notification_messages.onbeforeunloadMessage')),
        takeUntil(this.destroy$),
      )
      .subscribe(([need, message]) => {
        this.onbeforeunloadMessage = message;
        window.onbeforeunload = need ? this.onCloseWindowHandler.bind(this) : null;
      });

    this.streamUpdatesService
      .onUpdates()
      .pipe(withLatestFrom(this.tabs$), takeUntil(this.destroy$))
      .subscribe(([updates, tabs]) => {
        if (updates.renamed.length) {
          updates.renamed.forEach((data) => {
            this.onRename(
              tabs,
              (tab) => tab.stream === data.oldName,
              (tab) => {
                tab.stream = data.newName;
                tab.name = data.newName;
              },
            );
          });
        }

        if (updates.deleted.length) {
          const affected = tabs.filter((tab) => updates.deleted.includes(tab.stream));
          affected.forEach((tab) => this.appStore.dispatch(new RemoveTab({tab})));
        }
      });

    this.streamRenameService
      .onSpaceRenamed()
      .pipe(withLatestFrom(this.tabs$), takeUntil(this.destroy$))
      .subscribe(([{streamId, oldName, newName}, tabs]) => {
        this.onRename(
          tabs,
          (tab) => tab.space === oldName && tab.stream === streamId,
          (tab) => (tab.space = newName),
        );
      });

    this.streamRenameService
      .onSymbolRenamed()
      .pipe(withLatestFrom(this.tabs$), takeUntil(this.destroy$))
      .subscribe(([{streamId, oldName, newName}, tabs]) => {
        this.onRename(
          tabs,
          (tab) => tab.symbol === oldName && tab.stream === streamId,
          (tab) => (tab.symbol = newName),
        );
      });
  }

  ngAfterViewInit() {
    this.onTabs()
      .pipe(takeUntil(this.destroy$), delay(0))
      .subscribe((tabs: TabModel[]) => {
        const activeTabIndex = tabs.findIndex((tab) => tab.active);
        if (activeTabIndex === -1) {
          if (tabs?.length) {
            this.navigateToTab(tabs[0]);
          } else {
            this.openTabsList = false;
            this.router.navigate([`/${appRoute}`]);
            this.cdr.markForCheck();
          }

          return;
        } else {
          this.navigateToTab(tabs[activeTabIndex]);
        }

        const shadowPadding = 19;
        const tabEl = this.tabElements?.get(activeTabIndex).nativeElement;
        const scrollContainer: HTMLElement =
          this.scrollBarComponent.directiveRef.elementRef.nativeElement;
        const scrollRange = {
          left: scrollContainer.scrollLeft + shadowPadding,
          right: scrollContainer.scrollLeft + scrollContainer.offsetWidth,
        };
        const tabRange = {left: tabEl.offsetLeft, right: tabEl.offsetWidth + tabEl.offsetLeft};

        if (tabRange.left < scrollRange.left) {
          this.scrollBarComponent.directiveRef.scrollToX(tabRange.left - shadowPadding);
        }

        if (tabRange.right > scrollRange.right) {
          this.scrollBarComponent.directiveRef.scrollToX(
            tabRange.right - scrollContainer.offsetWidth + shadowPadding,
          );
        }
      });
  }

  streamsTrack(index: number, item: TabModel) {
    return item.id; // or item.id
  }

  closeTab(tab: TabModel) {
    this.checkSeChanges(tab)
      .pipe(delay(0))
      .subscribe(() => this.appStore.dispatch(new StreamsTabsActions.RemoveTab({tab})));
  }

  closeAllTabs() {
    this.checkSeChanges().subscribe(() => {
      this.closeTabList();
      this.appStore.dispatch(new StreamsTabsActions.RemoveAllTabs());
    });
  }

  toggleTabList() {
    this.openTabsList = !this.openTabsList;
  }

  closeTabList() {
    this.openTabsList = false;
  }

  ngOnDestroy(): void {
    window.onbeforeunload = null;
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  onDropped({
    container: {data},
    previousIndex,
    currentIndex,
  }: {
    container: {data: TabModel[]};
    previousIndex: number;
    currentIndex: number;
  }) {
    moveItemInArray(data, previousIndex, currentIndex);
    const updateEvent = data.map((tab, index) => ({tab, position: index}));
    this.appStore.dispatch(new UpdateTab(updateEvent));
    this.scrollingOnMove.left.stop$.next();
    this.scrollingOnMove.right.stop$.next();
    this.scrollingOnMove.left.state = false;
    this.scrollingOnMove.right.state = false;
    this.tabMoving = false;
  }

  onDragClick(event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.dragElDelta = {
      left: event.clientX - rect.left,
      right: event.clientX - rect.right,
    };
  }

  onDragMoved(event: CdkDragMove) {
    this.tabMoving = true;
    this.contextMenuControlService.closeMenu('tab-context-menu');
    const scrollBarRect = this.tabsScrollBarEl.nativeElement.getBoundingClientRect();
    const leftEdge = event.pointerPosition.x - this.dragElDelta.left - scrollBarRect.left;
    const rightEdge = scrollBarRect.right - event.pointerPosition.x + this.dragElDelta.right;

    [
      ['left', leftEdge],
      ['right', rightEdge],
    ].forEach(([side, distance]) => {
      if (distance <= 25) {
        if (!this.scrollingOnMove[side].state) {
          this.scrollingOnMove[side].state = true;
          interval(100)
            .pipe(takeUntil(this.scrollingOnMove[side].stop$))
            .subscribe(() => {
              const current = this.tabsScrollBar.directiveRef.geometry().x;
              const target = side === 'left' ? current - 20 : current + 20;
              this.tabsScrollBar.directiveRef.scrollToX(target, 100);
              event.source.dropContainer._dropListRef.beforeStarted.next();
            });
        }
      } else {
        if (this.scrollingOnMove[side].state) {
          this.scrollingOnMove[side].stop$.next();
          this.scrollingOnMove[side].state = false;
        }
      }
    });
  }

  onTabsScroll() {
    this.contextMenuControlService.closeMenu('tab-context-menu');
  }

  openTabContextMenu(index: number, event: MouseEvent) {
    this.contextMenuControlService.show(
      {
        event: event,
        item: index,
        contextMenu: this.tabsContextMenu,
      },
      'tab-context-menu',
    );
  }

  closeToLeft(index: number) {
    this.closeTabByIndex((_index) => _index < index);
  }

  closeToRight(index: number) {
    this.closeTabByIndex((_index) => _index > index);
  }

  closeOthers(index: number) {
    this.closeTabByIndex((_index) => _index !== index);
  }

  private onRename(
    tabs: TabModel[],
    compare: (tab: TabModel) => boolean,
    update: (tab: TabModel) => void,
  ) {
    const affected = tabs.map((tab, index) => (compare(tab) ? {tab, index} : null)).filter(Boolean);

    const active = affected.find(({tab}) => tab.active);
    this.appStore.dispatch(
      new UpdateTab(
        affected.map(({tab, index}) => {
          update(tab);
          return {tab, position: index};
        }),
      ),
    );

    if (active) {
      this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
        this.router.navigate([appRoute, ...active.tab.linkArray], {
          queryParams: active.tab.linkQuery,
        }),
      );
    }
  }

  private onCloseWindowHandler(event: Event) {
    // @ts-ignore
    event.returnValue = this.onbeforeunloadMessage;
    return this.onbeforeunloadMessage;
  }

  private closeTabByIndex(filter: (index: number) => boolean) {
    this.tabs$.pipe(take(1)).subscribe((tabs) => {
      this.appStore.dispatch(new RemoveTabs({tabs: tabs.filter((tab, index) => filter(index))}));
    });
  }

  private checkSeChanges(tab: TabModel = null): Observable<boolean> {
    return this.onCloseTabAlertService
      .check(tab)
      .pipe(take(1), takeWhile(Boolean)) as Observable<boolean>;
  }

  private onTabs(): Observable<TabModel[]> {
    return this.tabs$.pipe(
      distinctUntilChanged(
        (prev, current) => prev.find((t) => t.active)?.id === current.find((t) => t.active)?.id,
      ),
    );
  }

  private navigateToTab(tab: TabModel | null) {
    if (!tab) {
      return;
    }

    this.router.navigate([`/${appRoute}`, ...tab.linkArray], {
      replaceUrl: true,
      queryParams: tab.linkQuery,
    });
  }

  private navigateFromRoot() {
    const state = this.router.routerState;
    let params: {stream?: string; id?: string} = {};
    let route = state.snapshot.root;
    do {
      params = {...params, ...route.params};
      route = route.firstChild;
    } while (route);
    if (!params.stream && !params.id) {
      this.onTabs()
        .pipe(take(1))
        .subscribe((tabs) => {
          this.navigateToTab(tabs[0]);
        });
    }
  }
}
