import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormControl} from '@angular/forms';
import {Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {StorageMap} from '@ngx-pwa/local-storage';
import {TranslateService} from '@ngx-translate/core';
import {BsModalService} from 'ngx-bootstrap/modal';
import {TooltipDirective} from 'ngx-bootstrap/tooltip';
import {ContextMenuService} from 'ngx-contextmenu';
import {Observable, Subject} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  mapTo,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import {AppState} from '../../../../core/store';
import {getAppInfo} from '../../../../core/store/app/app.selectors';
import {AppInfoModel} from '../../../../shared/models/app.info.model';
import {MenuItem, MenuItemType} from '../../../../shared/models/menu-item';
import {GlobalResizeService} from '../../../../shared/services/global-resize.service';
import {MenuItemsService} from '../../../../shared/services/menu-items.service';
import {PermissionsService} from '../../../../shared/services/permissions.service';
import {StreamModel} from '../../models/stream.model';
import {StreamsStateModel} from '../../models/streams.state.model';
import {StreamRenameService} from '../../services/stream-rename.service';
import {StreamUpdatesService} from '../../services/stream-updates.service';
import * as StreamsActions from '../../store/streams-list/streams.actions';
import * as fromStreams from '../../store/streams-list/streams.reducer';
import {getActiveOrFirstTab} from '../../store/streams-tabs/streams-tabs.selectors';
import {StreamsNavigationService} from '../../streams-navigation/streams-navigation.service';
import {CreateStreamModalComponent} from '../modals/create-stream-modal/create-stream-modal.component';
import {ModalImportFileComponent} from '../modals/modal-import-file/modal-import-file.component';

@Component({
  selector: 'app-streams-list',
  templateUrl: './streams-list.component.html',
  styleUrls: ['./streams-list.component.scss'],
})
export class StreamsListComponent implements OnInit, OnDestroy {
  @ViewChild('modalTemplate', {static: true}) modalTemplate;
  @ViewChild('createStreamModalTemplate', {static: true}) createStreamModalTemplate;
  @ViewChild(CdkVirtualScrollViewport, {static: true}) virtualScroll: CdkVirtualScrollViewport;

  activeTabType: string;
  menuSmall = false;
  streams: StreamModel[];
  showClear: boolean;
  openedSymbolsListStream: StreamModel;
  appInfo: Observable<AppInfoModel>;
  menuLoaded = false;
  searchControl = new FormControl('');
  showSpaces: boolean;
  menu: MenuItem[];
  flatMenu: MenuItem[];
  isWriter$: Observable<boolean>;
  @ViewChild('showSpacesBtn', {read: TooltipDirective}) private showSpacesBtn: TooltipDirective;
  private destroy$ = new Subject<any>();

  constructor(
    private contextMenuService: ContextMenuService,
    private modalService: BsModalService,
    private fb: FormBuilder,
    private translate: TranslateService,
    private appStore: Store<AppState>,
    private router: Router,
    private globalResizeService: GlobalResizeService,
    private menuItemsService: MenuItemsService,
    private cdRef: ChangeDetectorRef,
    private storage: StorageMap,
    private streamUpdatesService: StreamUpdatesService,
    private streamsStore: Store<fromStreams.FeatureState>,
    private spaceRenameService: StreamRenameService,
    private permissionsService: PermissionsService,
    private streamsNavigationService: StreamsNavigationService,
  ) {}

  ngOnInit() {
    this.streamsStore.dispatch(new StreamsActions.GetStreams({}));
    this.streamsStore.dispatch(new StreamsActions.AddStreamStatesSubscription());
    this.isWriter$ = this.permissionsService.isWriter();

    this.appInfo = this.appStore.pipe(select(getAppInfo));
    this.appStore
      .pipe(select(getActiveOrFirstTab), takeUntil(this.destroy$))
      .subscribe((activeTab) => {
        this.activeTabType = activeTab?.type || null;
      });

    this.searchControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        map((value) => value?.trim()),
        distinctUntilChanged(),
        switchMap((value) => this.updateStorageItem('search', value)),
        switchMap(() => this.freshMenu()),
      )
      .subscribe();

    this.getStorage()
      .pipe(
        tap((storage) => {
          this.menuSmall = !storage.menuSmall;
          this.toggleMenu();
          this.showSpaces = storage.showSpaces;
          this.searchControl.patchValue(storage.search);
          this.cdRef.detectChanges();
        }),
        switchMap(() => this.freshMenu()),
        catchError(() => {
          return this.updatePath(() => []).pipe(switchMap(() => this.freshMenu()));
        }),
      )
      .subscribe(() => this.scrollToActiveMenu());

    this.streamUpdatesService
      .onUpdates()
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: StreamsStateModel) => {
        if (event.renamed.length) {
          event.renamed.forEach((data) => this.onStreamRenamed(data.oldName, data.newName));
        }

        if (event.added.length) {
          this.onStreamAdded();
        }

        if (event.deleted.length) {
          this.onStreamDeleted(event.deleted as string[]);
        }

        if (event.changed.length) {
          this.onStreamChanged();
        }

        this.menuItemsService.clearCache();
      });

    this.spaceRenameService
      .onSpaceRenamed()
      .pipe(
        takeUntil(this.destroy$),
        switchMap(({streamId, oldName, newName}) => {
          let spacePath = null;
          const oldNameEncoded = encodeURIComponent(oldName);
          const newNameEncoded = encodeURIComponent(newName);

          this.recursiveMenu((item, path) => {
            if (
              item.meta.stream?.id === streamId &&
              item.type === MenuItemType.space &&
              item.id === oldName
            ) {
              item.id = item.name = newName;
              spacePath = path;
            }
          });

          this.addMeta();
          this.makeFlatMenu();

          const newPath =
            spacePath.substr(0, spacePath.length - oldNameEncoded.length) + newNameEncoded;
          return this.updatePath((paths) =>
            paths.map((path) =>
              path.startsWith(spacePath) ? newPath + path.substr(spacePath.length) : path,
            ),
          );
        }),
      )
      .subscribe(() => this.cdRef.detectChanges());
  }

  freshMenu(cache = true): Observable<null> {
    this.recursiveMenu((item) => {
      item.children = [];
    });

    return this.getStoragePaths().pipe(
      switchMap((paths) => this.getItems(paths.concat(['/']), cache)),
      take(1),
      tap((menuItem) => {
        this.menu = menuItem.children;
        this.menuLoaded = true;
        this.addMeta();
        this.makeFlatMenu();
        this.cdRef.detectChanges();
      }),
      mapTo(null),
    );
  }

  toggleMenuItem(menuItem: MenuItem, path: string[]) {
    const open = !menuItem.children.length;
    const fullPath = path.concat(menuItem.id).map((path) => encodeURIComponent(path));
    const pathString = `/${fullPath.join('/')}`;

    if (!open) {
      menuItem.original.children = [];
      this.updatePath((paths) => paths.filter((path) => !path.startsWith(pathString))).subscribe();
      this.addMeta();
      this.makeFlatMenu();
      return;
    }

    this.updatePath((paths) => {
      paths.push(pathString);
      return paths;
    }).subscribe();

    this.getItems([pathString]).subscribe((responseItem) => {
      let item = responseItem;
      fullPath.forEach((part) => {
        item = item?.children.find((child) => encodeURIComponent(child.id) === part);
      });
      menuItem.original.children = item?.children || [];
      this.addMeta();
      this.makeFlatMenu();
      this.cdRef.detectChanges();
    });
  }

  toggleMenu() {
    this.menuSmall = !this.menuSmall;
    this.updateStorageItem('menuSmall', this.menuSmall).subscribe();
    this.globalResizeService.collapse(this.menuSmall);
    const body = document.getElementsByTagName('body')[0];
    if (this.menuSmall) {
      body.classList.add('body-menu-small');
    } else {
      body.classList.remove('body-menu-small');
    }
  }

  collapseAll() {
    this.recursiveMenu((item) => {
      item.children = [];
    });
    this.updatePath(() => []).subscribe();
    this.addMeta();
    this.makeFlatMenu();
    this.cdRef.detectChanges();
  }

  onCloseContextMenu() {
    this.contextMenuService.closeAllContextMenus({eventType: 'cancel'});
  }

  onClearSearch() {
    this.searchControl.setValue('');
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  onAskToCreateStream() {
    this.modalService.show(CreateStreamModalComponent, {
      class: 'modal-small',
      ignoreBackdropClick: true,
    });
  }

  onImportFromQMSG() {
    this.modalService.show(ModalImportFileComponent, {
      class: 'scroll-content-modal',
      ignoreBackdropClick: true,
    });
    this.onCloseContextMenu();
  }

  toggleSpaces() {
    this.showSpaces = !this.showSpaces;
    this.updateStorageItem('showSpaces', this.showSpaces).subscribe();

    this.updatePath((paths) => {
      this.recursiveMenu((item, itemPath) => {
        if (!item.children.length) {
          return false;
        }

        if (!this.showSpaces && item.type === MenuItemType.space) {
          paths = paths.map((path) => {
            if (!path.startsWith(itemPath)) {
              return path;
            }

            const streamLength = item.id.length + 1;
            const streamIdStart = itemPath.length - streamLength;
            return path.substr(0, streamIdStart) + path.substr(itemPath.length);
          });
        }
      });

      return [...new Set(paths)];
    })
      .pipe(
        switchMap(() => this.freshMenu()),
        switchMap(() =>
          this.updatePath((paths) =>
            paths.filter((path) => this.recursiveMenu((item, itemPath) => itemPath === path)),
          ),
        ),
      )
      .subscribe();
  }

  private scrollToActiveMenu() {
    const activeItemIndex = this.flatMenu.findIndex((item) => {
      const url = this.streamsNavigationService.url(item, this.activeTabType);
      if (!url) {
        return false;
      }
      let urlString = `/${url
        .filter((u) => u !== '/')
        .map((u) => encodeURIComponent(u))
        .join('/')}`;

      const params = this.streamsNavigationService.params(item, this.activeTabType);
      if (!params.space) {
        delete params.space;
      }
      const paramsString = new URLSearchParams(params).toString();
      if (paramsString) {
        urlString += `?${paramsString}`;
      }

      return this.streamsNavigationService.urlIsActive(urlString);
    });

    if (activeItemIndex > -1) {
      const elementsInViewPort = this.virtualScroll.getViewportSize() / 22;
      this.virtualScroll.scrollToIndex(Math.max(0, activeItemIndex - elementsInViewPort / 2));
    }
  }

  private getItems(paths: string[], cache = true): Observable<MenuItem> {
    return this.menuItemsService.getItems(
      paths,
      this.showSpaces,
      this.searchControl.value?.trim(),
      cache,
    );
  }

  private onStreamRenamed(oldName: string, newName: string) {
    this.recursiveMenu((item, path) => {
      if (item.type === MenuItemType.stream && item.id === oldName) {
        item.id = newName;
        const newPath = `/${encodeURIComponent(newName)}`;
        this.updatePath((paths) => {
          return paths.map((p) => (p.startsWith(path) ? `${newPath}${p.substr(path.length)}` : p));
        })
          .pipe(
            switchMap(() => this.getItems(['/'], false)),
            take(1),
          )
          .subscribe((rootMenu) => {
            const newStream = rootMenu.children.find((item) => item.id === newName);
            item.name = newStream.name;
            this.cdRef.detectChanges();
          });
      }
    });
  }

  private makeFlatMenu(items: MenuItem[] = null, path: string[] = [], level = 0) {
    if (!items) {
      this.flatMenu = [];
    }

    (items || this.menu).forEach((item) => {
      this.flatMenu.push({...item, path, level, original: item});
      this.makeFlatMenu(item.children, path.concat(item.id), level + 1);
    });
  }

  private onStreamAdded() {
    this.getItems(['/'], false)
      .pipe(take(1))
      .subscribe((rootMenu) => {
        this.menu = rootMenu.children.map((item) => ({
          ...item,
          children: this.menu.find((_item) => _item.id === item.id)?.children || item.children,
        }));
        this.addMeta();
        this.makeFlatMenu();
        this.cdRef.detectChanges();
      });
  }

  private onStreamDeleted(ids: string[]) {
    this.menu.forEach((item, index) => {
      if (ids.includes(item.id)) {
        this.updatePath((paths) =>
          paths.filter((path) => path.startsWith(`/${encodeURIComponent(item.id)}`)),
        ).subscribe();
        this.menu.splice(index, 1);
      }
    });
    this.addMeta();
    this.makeFlatMenu();
    this.cdRef.detectChanges();
  }

  private onStreamChanged() {
    this.freshMenu(false).subscribe();
  }

  private recursiveMenu(
    callback: (item: MenuItem, path: string) => boolean | void,
    items: MenuItem[] = null,
    path: string = '',
  ): MenuItem {
    items = items || this.menu;
    return items?.find((item) => {
      const itemPath = `${path}/${encodeURIComponent(item.id)}`;
      const inChildren = this.recursiveMenu(callback, item.children || [], itemPath);
      if (inChildren) {
        return inChildren;
      }
      return callback(item, itemPath);
    });
  }

  private updatePath(callback: (paths: string[]) => string[]): Observable<void> {
    return this.getStoragePaths().pipe(
      switchMap((storePaths) => {
        const paths = callback(storePaths);
        return this.updateStorageItem('paths', paths);
      }),
      take(1),
    );
  }

  private getStoragePaths(): Observable<string[]> {
    return this.getStorage().pipe(map((leftMenu: {paths?: string[]}) => leftMenu.paths || []));
  }

  private getStorage(): Observable<{
    paths?: string[];
    menuSmall?: boolean;
    showSpaces?: boolean;
    search?: string;
  }> {
    return this.storage.get('leftMenu').pipe(
      take(1),
      map((data) => data || {}),
    );
  }

  private updateStorageItem(key: string, value: unknown): Observable<void> {
    return this.getStorage().pipe(
      switchMap((storage) => {
        storage[key] = value;
        return this.storage.set('leftMenu', storage);
      }),
      take(1),
    );
  }

  private addMeta(
    items: MenuItem[] = null,
    stream = null,
    space = null,
    symbol = null,
    chartType = null,
  ) {
    const targetItems = items || this.menu;
    targetItems.forEach((item) => {
      if (item.type === MenuItemType.stream) {
        stream = item;
        chartType = item.chartType;
      }

      if (item.type === MenuItemType.space) {
        space = item;
      }

      if (item.type === MenuItemType.identity) {
        symbol = item.id;
      }

      item.meta = {
        stream,
        space,
        symbol,
        chartType,
      };

      this.addMeta(item.children, stream, space, symbol, chartType);
    });
  }
}
