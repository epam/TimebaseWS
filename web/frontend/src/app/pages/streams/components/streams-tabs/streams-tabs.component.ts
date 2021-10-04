import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router }                                                      from '@angular/router';
import { select, Store }                                                                       from '@ngrx/store';
import { TranslateService }                                                                    from '@ngx-translate/core';
import { BsModalRef, BsModalService }                                                          from 'ngx-bootstrap';

import {
  PerfectScrollbarComponent,
  PerfectScrollbarConfigInterface,
}                              from 'ngx-perfect-scrollbar';
import { Observable, Subject } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  skip,
  take,
  takeUntil,
  takeWhile,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { AppState }             from '../../../../core/store';
import * as AuthActions
                                from '../../../../core/store/auth/auth.actions';
import { GlobalFiltersService } from '../../../../shared/services/global-filters.service';
import { appRoute }             from '../../../../shared/utils/routes.names';

import { StreamModel }            from '../../models/stream.model';
import { TabModel }               from '../../models/tab.model';
import { TabSettingsModel }       from '../../models/tab.settings.model';
import { OnCloseTabAlertService } from '../../services/on-close-tab-alert.service';
import * as StreamDetailsActions  from '../../store/stream-details/stream-details.actions';
import * as fromStreamDetails     from '../../store/stream-details/stream-details.reducer';

import * as fromStreamProps     from '../../store/stream-props/stream-props.reducer';
import * as fromStreams         from '../../store/streams-list/streams.reducer';
import * as  StreamsTabsActions from '../../store/streams-tabs/streams-tabs.actions';

import {
  getActiveTabSettings,
  getTabsState,
}                                 from '../../store/streams-tabs/streams-tabs.selectors';
import { ModalSettingsComponent } from '../modals/modal-settings/modal-settings.component';
import { StorageService }         from '../../../../shared/services/storage.service';

@Component({
  selector: 'app-streams-tabs',
  templateUrl: './streams-tabs.component.html',
  styleUrls: ['./streams-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamsTabsComponent implements OnInit, OnDestroy {
  @ViewChild(PerfectScrollbarComponent) componentRef?: PerfectScrollbarComponent;
  
  public propsState: Observable<fromStreams.State>;
  public config: PerfectScrollbarConfigInterface = {};
  public openTabsList: boolean;
  public live: boolean;
  private destroy$ = new Subject();
  private psXReachEnd: boolean;
  private psXReachStart: boolean;
  private scrollXvalue: number;
  public openedProps: boolean;
  private bsModalRef: BsModalRef;
  private onbeforeunloadMessage: string;
  public globalFiltersHasChanges$: Observable<boolean>;
  public timezone$: Observable<string>;
  public tabSettings$: Observable<TabSettingsModel>;
  public tabSettings: TabSettingsModel = {};
  tabs$: Observable<TabModel[]>;
  
  constructor(
    private appStore: Store<AppState>,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private streamPropsStore: Store<fromStreamProps.FeatureState>,
    private modalService: BsModalService,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
    private translate: TranslateService,
    private storageService: StorageService,
    private onCloseTabAlertService: OnCloseTabAlertService,
    private globalSettingsService: GlobalFiltersService,
  ) { }
  
  ngOnInit() {
    this.tabSettings$ = this.appStore.pipe(select(getActiveTabSettings));
    this.tabSettings$.pipe(takeUntil(this.destroy$)).subscribe((settings: TabSettingsModel) => this.tabSettings = settings);
    this.streamDetailsStore.dispatch(new StreamDetailsActions.SetGlobalFilterState());
    this.globalFiltersHasChanges$ = this.globalSettingsService.hasChanges();
    this.timezone$ = this.globalSettingsService.getFilters().pipe(map(filters => filters.timezone[0].name));
    
    this.streamPropsStore.pipe(
      select('streamProps'),
      filter(props => !!props),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
      )
      .subscribe(props => {
        this.openedProps = !props['opened'];
        this.cdr.markForCheck();
      });
    
    this.tabs$ = this.appStore.pipe(
      select(getTabsState),
      map(state => state.tabs),
      tap(() => {
        if (this.componentRef && this.componentRef.directiveRef) {
          this.componentRef.directiveRef.update();
        }
      }),
    );
    
    this.activatedRoute.queryParams.subscribe(
      (params: Params) => {
        this.live = params.hasOwnProperty('live');
      },
    );
    
    this.onTabs().pipe(
      // Skip initial state
      skip(1),
      takeUntil(this.destroy$),
      )
      .subscribe((tabs: TabModel[]) => {
        if (tabs && tabs.length) {
          const tab = tabs.find(tab => tab.active) || tabs[0];
          this.navigateToTab(tab);
        } else {
          this.openTabsList = false;
          this.router.navigate([`/${appRoute}`]);
          this.cdr.markForCheck();
        }
      });
    
    this.navigateFromRoot();
  
    this.onCloseTabAlertService.isActiveTabNeedToCloseAlert().pipe(
      withLatestFrom(this.translate.get('notification_messages.onbeforeunloadMessage')),
      takeUntil(this.destroy$),
    ).subscribe(([need, message]) => {
      this.onbeforeunloadMessage = message;
      window.onbeforeunload = need ? this.onCloseWindowHandler.bind(this) : null;
    });
  }
  
  private onCloseWindowHandler(event: Event) {
    // @ts-ignore
    event.returnValue = this.onbeforeunloadMessage;
    return this.onbeforeunloadMessage;
  }

  streamsTrack(index: number, item: TabModel) {
    return item.id; // or item.id
  }
  
  scrollToX(x: number): void {
    this.componentRef.directiveRef.scrollTo(x, 500);
  }
  
  onScrollEvent(event: any): void {
    this.scrollXvalue = event.target.scrollLeft;
    this.psXReachStart = false;
    this.psXReachEnd = false;
    if (event.type === 'ps-x-reach-start') {
      this.psXReachStart = true;
    }
    if (event.type === 'ps-x-reach-end') {
      this.psXReachEnd = true;
    }
    if (!event.target.className.includes('ps--active-x')) {
      this.psXReachStart = true;
      this.psXReachEnd = true;
    }
  }
  
  closeTab(tab: TabModel) {
    this.checkSeChanges(tab).subscribe(() => this.appStore.dispatch(new StreamsTabsActions.RemoveTab({tab})));
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
    this.storageService.setPreviousActiveTab(null);
    this.destroy$.next(true);
    this.destroy$.complete();
  }
  
  openGlobalSettings() {
    const initialState = {
      title: 'Global Settings',
    };
    
    this.bsModalRef = this.modalService.show(ModalSettingsComponent, {initialState});
    this.bsModalRef.content.onFilter = (data) => {
      this.streamDetailsStore.dispatch(new StreamDetailsActions.SaveGlobalFilterState({global_filter: data}));
    };
    this.bsModalRef.content.onClear = () => {
      this.streamDetailsStore.dispatch(new StreamDetailsActions.ClearGlobalFilterState());
    };
    this.bsModalRef.content.closeBtnName = 'Close';
  }
  
  public onLogOut() {
    this.appStore.dispatch(new AuthActions.LogOut());
  }
  
  private checkSeChanges(tab: TabModel = null): Observable<boolean> {
    return this.onCloseTabAlertService.check(tab).pipe(take(1), takeWhile(Boolean)) as Observable<boolean>;
  }
  
  private onTabs(): Observable<TabModel[]> {
    return this.tabs$.pipe(
      distinctUntilChanged((prev, current) => prev.length === current.length),
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
    let params: { stream?: string, id?: string } = {};
    let route = state.snapshot.root;
    do {
      params = {...params, ...route.params};
      route = route.firstChild;
    } while (route);
    if (!params.stream && !params.id) {
      this.onTabs().pipe(take(1)).subscribe(tabs => {
        this.navigateToTab(tabs[0]);
      });
    }
  }
}
