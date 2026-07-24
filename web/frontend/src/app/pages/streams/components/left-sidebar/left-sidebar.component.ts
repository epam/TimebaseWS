import { ChangeDetectorRef, Component, HostListener, OnInit, ViewChild }          from '@angular/core';
import { select, Store }              from '@ngrx/store';
import { BsModalService }             from 'ngx-bootstrap/modal';
import { ContextMenuService }         from '@perfectmemory/ngx-contextmenu';
import { Observable, Subject, fromEvent }                 from 'rxjs';
import { distinctUntilChanged, map, take, takeUntil }                  from 'rxjs/operators';

import { AppState }                   from '../../../../core/store';
import { getAppInfo }                 from '../../../../core/store/app/app.selectors';
import { getActiveOrFirstTab }        from '../../store/streams-tabs/streams-tabs.selectors';
import * as StreamsActions            from '../../store/streams-list/streams.actions';
import { GlobalResizeService }        from '../../../../shared/services/global-resize.service';
import { PlaybackService } from '../../services/playback.service';
import { LeftSidebarStorageService }  from '../../../../shared/services/left-sidebar-storage.service';
import { PermissionsService }         from '../../../../shared/services/permissions.service';
import { CreateStreamModalComponent } from '../modals/create-stream-modal/create-stream-modal.component';
import { CreateViewModalComponent }   from '../modals/create-view/create-view-modal.component';
import { ModalImportQSMSGFileComponent }   from '../modals/modal-import-QSMSG-file/modal-import-QSMSG-file.component';
import { ModalImportCSVFileComponent } from '../modals/modal-import-csv-file/modal-import-csv-file.component';
import { StreamsListComponent } from '../streams-list/streams-list.component';
import { eventKeyMatchesTarget } from 'src/app/shared/utils/eventKeyMatchesTarget';
import { GlobalFiltersService } from 'src/app/shared/services/global-filters.service';

@Component({
  selector: 'app-left-sidebar',
  templateUrl: './left-sidebar.component.html',
  styleUrls: ['./left-sidebar.component.scss'],
})
export class LeftSidebarComponent implements OnInit {
  
  menuSmall = false;
  isWriter$: Observable<boolean>;
  version$: Observable<string>;
  activePlaybackIds: number[];
  showTopics$: Observable<boolean>;
  private activeTabTbId: string = null;
  private searchValue = '';
  @ViewChild(StreamsListComponent) streamsListComponent: StreamsListComponent;

  private destroy$ = new Subject<any>();

  @HostListener('keydown', ['$event']) handleKeyDown(event: KeyboardEvent) {
    if (!eventKeyMatchesTarget(event.key, ['ArrowUp', 'ArrowDown'])) {
      const eventInFilter = document.activeElement.closest('app-streams-list-search');
      if (eventInFilter) {
        this.searchValue = '';
        this.streamsListComponent.searchMenuItem('');
      } else {
        const noAlternateKeys = !event.altKey && !event.ctrlKey;
        const symbols = ['.', '-', '_', '#', ' ', '!', '/'];
        if ((event.code.includes('Key') || event.code.includes('Digit') || symbols.includes(event.key)) && this.searchValue.length < 14 && noAlternateKeys) {
          this.searchValue += event.key.toLowerCase();
        } else if (eventKeyMatchesTarget(event.key, ['Backspace'])) {
          this.searchValue = this.searchValue.slice(0, this.searchValue.length - 1);
        };
        this.streamsListComponent.searchMenuItem(this.searchValue);
      }
    } else {
      event.preventDefault();
      return null;
    }
  }
  
  constructor(
    private globalResizeService: GlobalResizeService,
    private permissionsService: PermissionsService,
    private bsModalService: BsModalService,
    private contextMenuService: ContextMenuService,
    private appStore: Store<AppState>,
    private leftSidebarStorageService: LeftSidebarStorageService,
    private playbackService: PlaybackService,
    private globalFiltersService: GlobalFiltersService,
    private cdRef: ChangeDetectorRef
  ) { }
  
  ngOnInit(): void {
    this.appStore.dispatch(new StreamsActions.GetStreams({}));
    this.appStore.dispatch(new StreamsActions.AddStreamStatesSubscription());
    this.isWriter$ = this.permissionsService.isWriter();
    this.version$ = this.appStore.pipe(select(getAppInfo), map(appInfo => appInfo?.version));
    this.leftSidebarStorageService.getMenuSmall().pipe(take(1)).subscribe(menuSmall => {
      this.menuSmall = menuSmall;
      this.updateMenuSmall(this.menuSmall);
    });

    this.activePlaybackIds = Array.from(this.playbackService.activeSessions);
    this.playbackService.activeSessionsSubject
      .pipe(takeUntil(this.destroy$))
      .subscribe(activeSessiodIds => {
        this.activePlaybackIds = activeSessiodIds;
        this.cdRef.markForCheck();
      })

    fromEvent(document, 'focusin')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: FocusEvent) => {
        const focusOutside = !(event.target as HTMLElement).closest('app-left-sidebar');
        const focusInFilter = (event.target as HTMLElement).closest('app-streams-list-search');
        if (focusOutside || focusInFilter) {
          this.searchValue = '';
          this.streamsListComponent.searchMenuItem('');
        }
      });

    this.showTopics$ = this.globalFiltersService.getFilters().pipe(
      map((f) => f?.showTopics),
      distinctUntilChanged(),
    );

    this.appStore.pipe(
      select(getActiveOrFirstTab),
      map(tab => tab?.tbId || null),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(tbId => { this.activeTabTbId = tbId; });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
  
  toggleMenu() {
    this.menuSmall = !this.menuSmall;
    this.updateMenuSmall(this.menuSmall);
  }

  public resetSearch() {
    this.searchValue = '';
  }
  
  private updateMenuSmall(menuSmall: boolean) {
    this.leftSidebarStorageService.setMenuSmall(menuSmall);
    this.globalResizeService.collapse(menuSmall);
    const body = document.getElementsByTagName('body')[0];
    if (menuSmall) {
      body.classList.add('body-menu-small');
    } else {
      body.classList.remove('body-menu-small');
    }
  }
  
  createStream() {
    this.bsModalService.show(CreateStreamModalComponent, {
      class: 'modal-small',
      ignoreBackdropClick: true,
      initialState: { tbId: this.activeTabTbId },
    });
  }

  createTopic() {
    this.bsModalService.show(CreateStreamModalComponent, {
      class: 'modal-small',
      ignoreBackdropClick: true,
      initialState: { topic: true, tbId: this.activeTabTbId },
    });
  }

  createView() {
    this.bsModalService.show(CreateViewModalComponent, {
      ignoreBackdropClick: true,
      class: 'modal-xl',
      initialState: { tbId: this.activeTabTbId },
    });
  }
  
  onCloseContextMenu() {
    this.contextMenuService.closeAllContextMenus({eventType: 'cancel'});
  }

  closeOtherDropdowns(event) {
    if (document.querySelector('.open:not(.visible)') && event.pointerType 
      && document.querySelector('app-streams-list-search .dropdown-menu.show')) {
      (document.querySelector('.search-options-toggle-btn') as HTMLElement).click();
    }
    if (document.querySelector('context-menu-content') && event.pointerType) {
      this.onCloseContextMenu();
    }
  }
  
  onImportFromQSMSG() {
    this.bsModalService.show(ModalImportQSMSGFileComponent, {
      class: 'modal-xl',
      ignoreBackdropClick: true,
      initialState: { tbId: this.activeTabTbId },
    });
    this.onCloseContextMenu();
  }

  onImportFromSCV() {
    this.bsModalService.show(ModalImportCSVFileComponent, {
      ignoreBackdropClick: true,
      class: 'modal-xl',
      initialState: { tbId: this.activeTabTbId },
    });
    this.onCloseContextMenu();
  }
}
