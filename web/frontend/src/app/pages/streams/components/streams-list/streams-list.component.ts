import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router }                                   from '@angular/router';
import { select, Store }                            from '@ngrx/store';
import { TranslateService }                         from '@ngx-translate/core';
import { BsModalRef, BsModalService }               from 'ngx-bootstrap';
import { ContextMenuComponent, ContextMenuService } from 'ngx-contextmenu';
import { PerfectScrollbarConfigInterface }          from 'ngx-perfect-scrollbar';
import { Observable, Subject }                      from 'rxjs';
import { filter, map, take, takeUntil }             from 'rxjs/operators';
import { AppState }                                 from '../../../../core/store';
import { getAppInfo }                               from '../../../../core/store/app/app.selectors';
import { AppInfoModel }                             from '../../../../shared/models/app.info.model';
import { GlobalResizeService }                      from '../../../../shared/services/global-resize.service';
import { appRoute }                                 from '../../../../shared/utils/routes.names';
import { uniqueName }                               from '../../../../shared/utils/validators';
import { SpaceModel, StreamModel }                  from '../../models/stream.model';

import * as StreamsActions from '../../store/streams-list/streams.actions';
import * as fromStreams from '../../store/streams-list/streams.reducer';
import { getStreamsList, streamsListStateSelector } from '../../store/streams-list/streams.selectors';
import { getActiveOrFirstTab } from '../../store/streams-tabs/streams-tabs.selectors';
import { ModalDescribeComponent } from '../modals/modal-describe/modal-describe.component';
import { ModalPurgeComponent } from '../modals/modal-purge/modal-purge.component';
import { ModalRenameComponent } from '../modals/modal-rename/modal-rename.component';
import { ModalSendMessageComponent } from '../modals/modal-send-message/modal-send-message.component';
import { ModalTruncateComponent } from '../modals/modal-truncate/modal-truncate.component';
import { ModalExportFileComponent } from '../modals/modal-export-file/modal-export-file.component';
import { ExportFilterFormat } from '../../../../shared/models/export-filter';
import { ModalImportFileComponent } from '../modals/modal-import-file/modal-import-file.component';

@Component({
  selector: 'app-streams-list',
  templateUrl: './streams-list.component.html',
  styleUrls: ['./streams-list.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamsListComponent implements OnInit, OnDestroy, AfterViewInit {
  // @ViewChild(ContextMenuComponent, {static: true}) public basicMenu: ContextMenuComponent;
  @ViewChild('modalTemplate', { static: true }) modalTemplate;

  public createStreamModalRef: BsModalRef;
  public createStreamForm: FormGroup;
  @ViewChild('createStreamModalTemplate', { static: true }) createStreamModalTemplate;


  @ViewChild('listMenu', { static: true }) public listMenu: ContextMenuComponent;
  @ViewChild('streamsMenu', { static: true }) public streamsMenu: ContextMenuComponent;

  public deleteModalRef: BsModalRef;
  public deleteModalData: { stream: StreamModel, space?: SpaceModel };
  public activeTabType: string;

  public appRoute = appRoute;
  public menusmall = false;
  public streams: StreamModel[];
  public showClear: boolean;
  private expandArray = [];
  public openedSymbolsListStream: StreamModel;
  public streamsState: Observable<fromStreams.State>;
  public appInfo: Observable<AppInfoModel>;
  public loader: boolean;
  public loaderInit: boolean;
  public config: PerfectScrollbarConfigInterface = {};
  private destroy$ = new Subject<any>();
  public searchForm: FormGroup;
  public streamsListOptionsForm: FormGroup;
  private bsModalRef: BsModalRef;

  constructor(
    private streamsStore: Store<fromStreams.FeatureState>,
    private contextMenuService: ContextMenuService,
    private modalService: BsModalService,
    private fb: FormBuilder,
    private translate: TranslateService,
    private appStore: Store<AppState>,
    private router: Router,
    private globalResizeService: GlobalResizeService,
  ) {
  }

  ngOnInit() {
    this.menusmall = !JSON.parse(localStorage.getItem('toggleMenu'));
    this.toggleMenu();
    this.streamsStore.dispatch(new StreamsActions.GetStreams({}));
    this.streamsStore.dispatch(new StreamsActions.AddStreamStatesSubscription());
    this.streamsState = this.streamsStore.pipe(select(streamsListStateSelector));
    this.loaderInit = true;
    this.appInfo = this.appStore.pipe(select(getAppInfo));

    if (!this.streamsListOptionsForm) {
      this.streamsListOptionsForm = this.fb.group({
        'openNewTab': new FormControl(),
        'showSpaces': new FormControl(),
      });
    }

    this.appStore
      .pipe(
        select(getActiveOrFirstTab),
        // filter((activeTab: TabModel) => !!(activeTab && activeTab.type)),
        takeUntil(this.destroy$),
      )
      .subscribe(activeTab => {
        if (activeTab && activeTab.type) {
          this.activeTabType = activeTab.type;
        } else {
          this.activeTabType = null;
        }
      });

    this.streamsState.pipe(
      map(data => data.streams),
      takeUntil(this.destroy$),
    ).subscribe((streams) => {
      if (!this.searchForm) {
        this.searchForm = this.fb.group({
          'search': new FormControl(),
        });
      }


      if (streams && streams.length) {
        this.loaderInit = false;
        this.streams = [...streams];
        if (this.streams.find(stream => stream._shown)) {
          this.loader = false;
        }
        this.expandArray = this.streams.filter(stream => stream._shown);
      } else if (streams && !streams.length) {
        this.loaderInit = false;
        this.loader = false;
      }
    });
    const openNewTab = JSON.parse(localStorage.getItem('openNewTab'));
    if (openNewTab) {
      this.streamsListOptionsForm.get('openNewTab').setValue(openNewTab);
      this.streamsStore.dispatch(new StreamsActions.SetNavigationState({ _openNewTab: openNewTab }));
    }
    const showSpaces = JSON.parse(localStorage.getItem('showSpaces'));
    if (showSpaces) {
      this.streamsListOptionsForm.get('showSpaces').setValue(showSpaces);
      this.streamsStore.dispatch(new StreamsActions.SetNavigationState({ _showSpaces: showSpaces }));
    }
  }

  private forbiddenNames() {
    return uniqueName(
      this.appStore.pipe(
        select(getStreamsList),
        take(1),
        map(streams => streams.map(stream => stream.key)),
      ),
    );
  }

  public ifCreateStreamFormError() {
    const CONTROL = this.createStreamForm.get('key');
    return CONTROL && CONTROL.invalid && !CONTROL.pristine;
  }

  public ifCreateStreamFormKeyForbidden() {
    return this.createStreamForm.get('key').hasError('nameIsForbidden');
  }

  getChilds(event: MouseEvent, stream: StreamModel, space?: SpaceModel) {
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();

    this.getChildsHandler(stream, space);
  }

  getChildsHandler(stream: StreamModel, space?: SpaceModel) {
    this.onCloseContextMenu();
    const searchInputVal = this.searchForm.get('search').value;
    const spacesViewMode = this.streamsListOptionsForm.get('showSpaces').value;
    
    const object = space || stream;
    let objectHasViewData;
    
    if (space) {
      objectHasViewData = !!space?._symbolsList?.length;
    } else {
      objectHasViewData = !!(!spacesViewMode && stream._symbolsList?.length) ||
      !!(spacesViewMode && stream._spacesList?.length);
    }

    const toggleDropdown = (state: boolean) => {
      this.streamsStore.dispatch(new StreamsActions.SetStreamState({
        ...(space ? { spaceName: space.name } : {}),
        stream: stream, props: { _shown: state },
      }));
    };
    
    if (object._shown) {
      toggleDropdown(false);
      return;
    }

    if (objectHasViewData) {
      toggleDropdown(true);
      return;
    }

    this.loader = true;

    if (space) {
      // Get symbols for space
      this.streamsStore.dispatch(new StreamsActions.GetSymbols({
        streamKey: stream.key,
        spaceName: space.name,
        ...(searchInputVal?.length ? { props: { _filter: searchInputVal } } : {}),
      }));
    } else if (spacesViewMode) {
      // Get spaces for stream
      this.streamsStore.dispatch(new StreamsActions.GetSpaces({
        streamKey: stream.key,
        props: { _filter: searchInputVal },
      }));
    } else {
      // Get symbols for stream
      this.streamsStore.dispatch(new StreamsActions.GetSymbols({
        streamKey: stream.key,
        ...(searchInputVal?.length ? { props: { _filter: searchInputVal } } : {}),
      }));
    }

    this.expandArray = [];
  }

  toggleMenu() {
    this.menusmall = !this.menusmall;
    localStorage.setItem('toggleMenu', JSON.stringify(this.menusmall));
    this.globalResizeService.collapse(this.menusmall);
    const body = document.getElementsByTagName('body')[0];
    if (this.menusmall) {
      body.classList.add('body-menu-small');
    } else {
      body.classList.remove('body-menu-small');
    }
  }

  collapseAll() {
    this.streamsState
      .pipe(
        filter(state => !!(state.streams && state.streams.length)),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe(state => {
        state.streams.forEach(stream => {
          if (stream._shown) {
            this.streamsStore.dispatch(new StreamsActions.SetStreamState({
              stream: stream,
              props: {
                _shown: false,
              },
            }));
          }
        });
      });
  }

  streamsTrack(index: number, item: StreamModel) {
    return item.key; // or item.id
  }

  symbolsTrack(index, item) {
    return item; // or item.id
  }

  spacesTrack(index, item) {
    return item.name; // or item.id
  }

  onShowContextMenu($event) {
    // debugger;
    this.contextMenuService.show.next({
      // Optional - if unspecified, all context menu components will open
      contextMenu: this.streamsMenu,
      event: $event,
      item: undefined,
      // item: streamProps,
    });

    $event.preventDefault();
    $event.stopImmediatePropagation();
    $event.stopPropagation();
  }

  onCloseContextMenu() {
    this.contextMenuService.closeAllContextMenus({
      eventType: 'cancel',
    });
  }

  changeOpenNewTab() {
    const openNewTab = this.streamsListOptionsForm.get('openNewTab').value;
    this.streamsStore.dispatch(new StreamsActions.SetNavigationState({ _openNewTab: openNewTab }));
    localStorage.setItem('openNewTab', JSON.stringify(openNewTab));
  }

  changeShowSpaces() {
    const showSpaces = this.streamsListOptionsForm.get('showSpaces').value;
    this.streamsStore.dispatch(new StreamsActions.SetNavigationState({ _showSpaces: showSpaces }));
    localStorage.setItem('showSpaces', JSON.stringify(showSpaces));
    this.streamsState
      .pipe(
        filter(state => !!(state.streams && state.streams.length)),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe(state => {
        state.streams.forEach(stream => {
          if (stream._shown) {
            this.getChildsHandler({
              key: stream.key,
              name: stream.name,
              symbols: stream.symbols,
              _active: stream._active,
              _shown: false,
            });
          }
        });
      });
  }

  onSearch(event: any) {
    if (event.keyCode === 13) {
      this.getStreamsSearch();
    }
  }

  getStreamsSearch() {
    this.streamsStore.dispatch(new StreamsActions.GetStreams({
      props: {
        _filter: this.searchForm.get('search').value,
        _spaces: this.streamsListOptionsForm.get('showSpaces').value
      },
    }));
  }

  onChangeSearch() {
    this.showClear = !!this.searchForm.get('search').value.length;
  }

  onClearSearch() {
    this.searchForm.get('search').setValue('');
    this.showClear = !!this.searchForm.get('search').value.length;
    this.streamsStore.dispatch(new StreamsActions.GetStreams({}));
  }

  public checkRootSpace(space: SpaceModel) {
    return space && typeof space.name === 'string' && !space.name.length;
  }

  public onShowTruncateModal(item: { stream: StreamModel }) {
    if (!item?.stream?.key) return;

    this.onCloseContextMenu();
    this.translate.get('titles')
      .pipe(
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe((/*messages*/) => {
        const initialState = {
          stream: item.stream,
        };
        
        this.bsModalRef = this.modalService.show(ModalTruncateComponent, {
          initialState: initialState,
          ignoreBackdropClick: true,
        });

      });
  }

  public onShowPurgeModal(item: { stream: StreamModel }) {
    if (!(item && item.stream && item.stream.key)) return;

    const initialState = {
      stream: item.stream,
    };
    this.onCloseContextMenu();
    this.bsModalRef = this.modalService.show(ModalPurgeComponent, {
      initialState: initialState,
      ignoreBackdropClick: true,
    });

  }

  public onShowSendMessage(item: { stream: StreamModel }) {
    if (!(item && item.stream && item.stream.key)) return;

    const initialState = {
      stream: item.stream,
    };
    this.onCloseContextMenu();
    this.bsModalRef = this.modalService.show(ModalSendMessageComponent, {
      initialState: initialState,
      ignoreBackdropClick: true,
      class: 'modal-message',
    });

  }

  public onAskToDeleteStream(item: { stream: StreamModel }) {
    if (!(item && item.stream && item.stream.key)) return;
    this.onCloseContextMenu();

    this.deleteModalData = item;
    this.deleteModalRef = this.modalService.show(this.modalTemplate, {
      class: 'modal-small',
    });
  }

  public onShowEditNameModal(item: { stream: StreamModel, symbol?: string, space?: SpaceModel }) {
    if (!(item && item.stream && item.stream.key)) return;
    this.onCloseContextMenu();

    const initialState = {
      data: item,
    };

    this.deleteModalData = item;
    this.deleteModalRef = this.modalService.show(ModalRenameComponent, {
      // class: 'bg-dark modal-small',
      initialState: initialState,
      ignoreBackdropClick: true,
    });
  }

  public onShowDescribe(item: { stream: StreamModel }) {
    if (!(item && item.stream && item.stream.key)) return;
    this.onCloseContextMenu();

    const initialState = {
      stream: item.stream,
    };

    this.deleteModalData = item;
    this.deleteModalRef = this.modalService.show(ModalDescribeComponent, {
      // class: 'bg-dark modal-small',
      initialState: initialState,
      ignoreBackdropClick: true,
    });
  }

  public onDeleteStream(deleteModalData) {
    const stream = deleteModalData.stream as StreamModel;
    if (!(stream && stream.key)) return;
    this.appStore.dispatch(new StreamsActions.AskToDeleteStream({
      streamKey: stream.key,
      ...(deleteModalData.space ? { spaceName: deleteModalData.space.name } : {}),
    }));
    this.deleteModalRef.hide();
  }

  ngOnDestroy(): void {
    this.streamsStore.dispatch(new StreamsActions.StopStreamStatesSubscription());
    this.destroy$.next(true);
    this.destroy$.complete();
    // document.removeEventListener('click', this.onCloseContextMenu.bind(this));
  }

  ngAfterViewInit(): void {
    // document.addEventListener('click', this.onCloseContextMenu.bind(this));
  }

  public onAskToCreateStream() {

    this.createStreamForm = this.fb.group({
      key: new FormControl(null,
        {
          validators: [Validators.required],
          asyncValidators: [this.forbiddenNames()],
        },
      ),
    });

    this.modalService.onShow
      .pipe(
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        setTimeout(() => {
          const input = window.document.getElementById('keyInput');
          if (input) {
            input.focus();
          }
        }, 300);
      });
    this.createStreamModalRef = this.modalService.show(this.createStreamModalTemplate, {
      class: 'modal-small',
      ignoreBackdropClick: true,
    });

    this.onCloseContextMenu();
  }

  public onCreateStream() {
    if (this.createStreamForm.invalid) return;
    this.createStreamModalRef.hide();
    this.router.navigate([appRoute, 'stream', 'stream-create', this.createStreamForm.get('key').value]);
  }

  public get openInNewTab(): boolean {
    return this.streamsListOptionsForm.get('openNewTab').value;
  }

  onExportCsv(stream: StreamModel) {
    this.exportToFile(stream, ExportFilterFormat.CSV);
  }

  onExportQSMSGFile(item: { stream: StreamModel }) {
    this.exportToFile(item.stream, ExportFilterFormat.QSMSG);
  }

  onImportFromQMSG() {
    this.modalService.show(ModalImportFileComponent, {
      class: 'scroll-content-modal',
    });
    this.onCloseContextMenu();
  }

  private exportToFile(stream: StreamModel, exportFormat: ExportFilterFormat) {
    this.modalService.show(ModalExportFileComponent, {
      initialState: { stream, exportFormat },
      class: 'scroll-content-modal',
    });
    this.onCloseContextMenu();
  }
}

