import { CdkVirtualScrollViewport }       from '@angular/cdk/scrolling';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
}                                         from '@angular/core';
import {
  select,
  Store,
}                                         from '@ngrx/store';
import { TranslateService }               from '@ngx-translate/core';
import equal                              from 'fast-deep-equal/es6';
import { ContextMenuService }             from '@perfectmemory/ngx-contextmenu';
import {
  Observable,
  Subject,
  timer,
}                                         from 'rxjs';
import {
  catchError,
  delay,
  distinctUntilChanged,
  filter,
  map,
  mapTo,
  switchMap,
  take,
  takeUntil,
  tap,
}                                         from 'rxjs/operators';
import { AppState }                       from '../../../../core/store';
import {
  MenuItem,
  MenuItemType,
}                                         from '../../../../shared/models/menu-item';
import { GlobalFiltersService }           from '../../../../shared/services/global-filters.service';
import { LeftSidebarStorageService }      from '../../../../shared/services/left-sidebar-storage.service';
import { MenuItemsService }               from '../../../../shared/services/menu-items.service';
import { PermissionsService }             from '../../../../shared/services/permissions.service';
import { StreamModel }                    from '../../models/stream.model';
import {
  StructureUpdateAction,
  StructureUpdateType,
}                                         from '../../models/structure-update';
import { StreamRenameService }            from '../../services/stream-rename.service';
import { StructureUpdatesService }        from '../../services/structure-updates.service';
import { getActiveOrFirstTab }            from '../../store/streams-tabs/streams-tabs.selectors';
import { StreamsNavigationScrollService } from '../../streams-navigation/streams-navigation-scroll.service';
import { StreamsNavigationService }       from '../../streams-navigation/streams-navigation.service';
import { GridService } from 'src/app/shared/services/grid.service';
import { TabNavigationService } from 'src/app/shared/services/tab-navigation.service';
import { eventKeyMatchesTarget } from 'src/app/shared/utils/eventKeyMatchesTarget';
import { StreamsService } from 'src/app/shared/services/streams.service';
import { ImportFromTextFileService } from '../../services/import-from-text-file.service';

@Component({
  selector: 'app-streams-list',
  templateUrl: './streams-list.component.html',
  styleUrls: ['./streams-list.component.scss'],
  providers: [GridService],
})
export class StreamsListComponent implements OnInit, OnDestroy {
  @ViewChild(CdkVirtualScrollViewport) virtualScroll: CdkVirtualScrollViewport;
  
  activeTabType: string;
  streams: StreamModel[];
  showClear: boolean;
  openedSymbolsListStream: StreamModel;
  menuLoaded = false;
  showSpaces: boolean;
  menu: MenuItem[];
  flatMenu: MenuItem[];
  streamsCount: number;
  isWriter$: Observable<boolean>;
  treeViewId = 'streams';
  treeViews = [
    {
      title: 'streamList.treeViews.streams',
      id: 'streams',
    },
    {
      title: 'streamList.treeViews.views',
      id: 'views',
    },
  ];
  streamSelectedForImport: string;
  selectedItem: string;

  emptyListTitle$: Observable<string>;
  
  private destroy$ = new Subject<any>();
  
  constructor(
    private contextMenuService: ContextMenuService,
    private translate: TranslateService,
    private appStore: Store<AppState>,
    private menuItemsService: MenuItemsService,
    private cdRef: ChangeDetectorRef,
    private structureUpdatesService: StructureUpdatesService,
    private spaceRenameService: StreamRenameService,
    private permissionsService: PermissionsService,
    private streamsNavigationService: StreamsNavigationService,
    private streamsNavigationScrollService: StreamsNavigationScrollService,
    private globalFiltersService: GlobalFiltersService,
    private leftSidebarStorageService: LeftSidebarStorageService,
    private gridService: GridService,
    private tabNavigationService: TabNavigationService,
    private hostElement: ElementRef,
    private streamsService: StreamsService,
    private importFromTextFileService: ImportFromTextFileService
  ) {}
  
  ngOnInit() {
    this.isWriter$ = this.permissionsService.isWriter();
    this.appStore
      .pipe(select(getActiveOrFirstTab), takeUntil(this.destroy$))
      .subscribe((activeTab) => {
        this.activeTabType = activeTab?.type || null;
      });


    this.streamsService.streamRemoved
      .pipe(takeUntil(this.destroy$))
      .subscribe((streamId) => this.onItemDeleted([streamId]));

    this.streamsService.streamNameUpdated
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ streamId }) => {
        this.onItemDeleted([streamId]);
        this.onItemAdded(streamId);
    })

    this.emptyListTitle$ = this.leftSidebarStorageService.watchStorage().pipe(
      switchMap(storage => this.translate.get(`streamList.empty.${storage.search ? 'hasSearch' : 'noSearch'}.${storage.treeView}`, {search: storage.search})),
    );
    
    const showSpaces$ = this.globalFiltersService.getFilters().pipe(
      map((f) => f?.showSpaces),
      distinctUntilChanged(),
    );
    
    showSpaces$.pipe(takeUntil(this.destroy$)).subscribe((showSpaces) => {
      this.toggleSpaces(showSpaces);
    });
    
    const freshMenu$ = this.leftSidebarStorageService.watchStorage().pipe(
      map(storage => ({
        search: storage.search,
        treeView: storage.treeView,
        searchOptions: storage.search ? storage.searchOptions : null,
      })),
      filter(storage => storage.treeView !== undefined && storage.search !== undefined),
      distinctUntilChanged(equal),
    );
    
    freshMenu$.pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.leftSidebarStorageService.getStorage()),
      switchMap(({search, treeView}) => {
        this.menuLoaded = false;
        this.treeViewId = treeView;
        this.cdRef.detectChanges();
        return this.freshMenu(false);
      }),
      catchError(() => {
        return this.leftSidebarStorageService.updatePath(() => []).pipe(switchMap(() => this.freshMenu(false)));
      }),
      delay(0),
    ).subscribe(() => {
      this.menuLoaded = true;
      this.cdRef.detectChanges();
      this.streamsNavigationScrollService.scrollToActiveMenu();
    });
    
    this.streamsNavigationScrollService
      .onScrollToActiveMenu()
      .pipe(takeUntil(this.destroy$), delay(0))
      .subscribe(() => this.scrollToActiveMenu());
    
    this.leftSidebarStorageService.watchStorage().pipe(map(storage => storage.treeView), distinctUntilChanged()).pipe(
      switchMap((treeView) => this.structureUpdatesService.onUpdates().pipe(map(updates => ({treeView, updates})))),
      map(({updates, treeView}) => updates.filter(update =>
        (update.type === StructureUpdateType.stream && treeView === 'streams') || (update.type === StructureUpdateType.view && treeView === 'views')),
      ),
      takeUntil(this.destroy$),
    ).subscribe((events) => {
      const updatedStreams = [];
      events.forEach(event => {
        switch (event.action) {
          case StructureUpdateAction.rename:
            this.onStreamRenamed(event.id, event.target);
            break;
          case StructureUpdateAction.update:
            updatedStreams.push(event.viewMd?.stream || event.id);
            break;
          case StructureUpdateAction.add:
            this.onItemAdded(event.viewMd?.stream || event.id);
            break;
          case StructureUpdateAction.remove:
            this.onItemDeleted([event.viewMd?.stream || event.id]);
            break;
        }
      });
      
      if (updatedStreams.length) {
        this.onStreamChanged(updatedStreams);
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
          return this.leftSidebarStorageService.updatePath((paths) =>
            paths.map((path) =>
              path.startsWith(spacePath) ? newPath + path.substr(spacePath.length) : path,
            ),
          );
        }),
      )
      .subscribe(() => this.cdRef.detectChanges());

    this.importFromTextFileService.streamIdSubject
      .pipe(takeUntil(this.destroy$))
      .subscribe(streamId => {
        this.streamSelectedForImport = streamId;
        this.cdRef.detectChanges();
      })
  }

  @HostListener('keydown', ['$event']) handleKeyDown(event: KeyboardEvent) {
    if (!eventKeyMatchesTarget(event.key, ['ArrowUp', 'ArrowDown'])) {
      return;
    }
    event.preventDefault();

    const allStreamLinks = Array.from(this.hostElement.nativeElement.querySelectorAll('.menu-item-link'));
    const previousIndex = allStreamLinks.findIndex(el => el === event.target);
    
    let nextIndex: number | null;
    if (event.key === 'ArrowUp') {
      nextIndex = previousIndex === 0 ? null : previousIndex - 1;
    } else {
      nextIndex = previousIndex === allStreamLinks.length - 1 ? null : previousIndex + 1;
    }

    if (typeof nextIndex === 'number') {
      (allStreamLinks[nextIndex] as HTMLElement).focus();
    }
  }

  @HostListener('keydown.tab', ['$event']) handleTabKeyDown(event: KeyboardEvent) {
    if ((event.target as HTMLElement).classList.contains('menu-item-link')) {
      this.gridService.tabKeyNavigation(event, true);
      event.preventDefault();
    }
  }

  freshMenu(cache = true): Observable<null> {
    this.recursiveMenu((item) => {
      item.children = [];
    });
    
    return this.leftSidebarStorageService.getStoragePaths().pipe(
      switchMap((paths) => this.getItems(paths.concat(['/']), cache)),
      take(1),
      tap((menuItem) => {
        this.streamsCount = menuItem.totalCount || menuItem.childrenCount;
        this.menu = menuItem.children;
        this.addMeta();
        this.makeFlatMenu();
        this.menuLoaded = true;
        this.cdRef.detectChanges();
      }),
      mapTo(null),
    );
  }

  toggleMenuItemWithKeys(event: KeyboardEvent, menuItem: MenuItem, path: string[]) {
    if (eventKeyMatchesTarget(event.key, ['ArrowLeft', 'ArrowRight'])) {
      this.toggleMenuItem(event, menuItem, path, event.key);
      event.preventDefault();
    }
  }
  
  toggleMenuItem(event: MouseEvent | KeyboardEvent, menuItem: MenuItem, path: string[], eventKeyCode: string = '') {
    const open = !menuItem.children.length;
    const fullPath = path.concat(menuItem.id).map((path) => encodeURIComponent(path));
    const pathString = `/${fullPath.join('/')}`;

    if (event.type === 'click') {
      const clickEventTarget = event.target as HTMLElement;
      (clickEventTarget.nextElementSibling as HTMLElement).focus();
    }
    
    if (!open && (!eventKeyCode || eventKeyCode === 'ArrowLeft')) {
      menuItem.original.children = [];
      this.leftSidebarStorageService.updatePath((paths) => paths.filter((path) => !path.startsWith(pathString))).subscribe();
      this.addMeta();
      this.makeFlatMenu();
      return;
    }

    if (!eventKeyCode || eventKeyCode === 'ArrowRight') {
      this.leftSidebarStorageService.updatePath((paths) => {
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
        this.scrollDownIfBottomItem(event);
      });
    }
  }

  private scrollDownIfBottomItem(event: MouseEvent | KeyboardEvent) {
    const listItemBottomBorder = (event.target as HTMLElement).getBoundingClientRect().bottom;
    const scrollContainerBottomBorder = 
      this.virtualScroll.elementRef.nativeElement.getBoundingClientRect().bottom;

    if (scrollContainerBottomBorder - listItemBottomBorder < 80) {
      this.virtualScroll.elementRef.nativeElement.scrollTop += 90;
    }
  }
  
  collapseAll() {
    this.recursiveMenu((item) => {
      item.children = [];
    });
    this.leftSidebarStorageService.updatePath(() => []).subscribe();
    this.addMeta();
    this.makeFlatMenu();
    this.cdRef.detectChanges();
  }
  
  onCloseContextMenu() {
    this.contextMenuService.closeAllContextMenus({eventType: 'cancel'});
  }

  closeOtherDropdowns() {
    if (this.leftSidebarStorageService.dropdownsOpened.includes('create-stream-dropdown')) {
      (document.querySelector('.create-stream-toggle-btn') as HTMLElement).click();
      this.leftSidebarStorageService.removeOpenedDropdown('create-stream-dropdown');
    }
    if (this.leftSidebarStorageService.dropdownsOpened.includes('search-options-dropdown')) {
      (document.querySelector('.search-options-toggle-btn') as HTMLElement).click();
      this.leftSidebarStorageService.removeOpenedDropdown('search-options-dropdown');
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
  
  toggleSpaces(value: boolean) {
    this.showSpaces = value;
    this.leftSidebarStorageService.updateStorageItem('showSpaces', this.showSpaces);
    
    this.leftSidebarStorageService.updatePath((paths) => {
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
          this.leftSidebarStorageService.updatePath((paths) =>
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
    return this.leftSidebarStorageService.getStorage().pipe(switchMap(({treeView, search, searchOptions}) => {
      return this.menuItemsService.getItems(
        paths,
        this.showSpaces,
        search,
        treeView === 'views',
        search ? searchOptions : null,
        cache,
      );
    }));
  }
  
  private onStreamRenamed(oldName: string, newName: string) {
    this.recursiveMenu((item, path) => {
      if (item.type === MenuItemType.stream && item.id === oldName) {
        item.id = newName;
        item.name = newName;
        const newPath = `/${encodeURIComponent(newName)}`;
        this.leftSidebarStorageService.updatePath(
            (paths) => paths.map((p) => (p.startsWith(path) ? `${newPath}${p.substr(path.length)}` : p)),
          )
          .subscribe();
        
        return true;
      }
    });
    this.addMeta();
    this.makeFlatMenu();
  }
  
  private makeFlatMenu(items: MenuItem[] = null, path: string[] = [], level = 0) {
    if (!items) {
      this.flatMenu = [];
    }
    
    if (!items) {
      this.menu = this.menu.sort((i1, i2) => {
        if (i1.name?.toLowerCase() === i2.name?.toLowerCase()) {
          return i1.name > i2.name ? 1 : -1;
        }
        return i1.name?.toLowerCase() > i2.name?.toLowerCase() ? 1 : -1
      });
    }
    
    (items || this.menu).forEach((item) => {
      this.flatMenu.push({...item, path, level, original: item});
      if (item.children?.length) {
        this.makeFlatMenu(item.children, path.concat(item.id), level + 1);
      }
    });
  }
  
  private onItemAdded(stream: string) {
    if (this.menu.find(item => item.id === stream)) {
      return;
    }
    this.getItems([`/${stream}`], false)
      .pipe(take(1))
      .subscribe((rootMenu) => {
        // this.streamsCount = rootMenu.totalCount || rootMenu.childrenCount;
        if (rootMenu.children[0]) {
          this.menu.push({...rootMenu.children[0], children: []});
        }
        else {
          this.menu.push({id: stream});
        }
        this.addMeta();
        this.makeFlatMenu();
        this.cdRef.detectChanges();

        const selectedIndex = this.flatMenu.findIndex(elem => elem.id === stream);
        if (selectedIndex > -1) {
          this.virtualScroll.scrollToIndex(selectedIndex);
          this.selectedItem = stream;
          setTimeout(() => {
            this.selectedItem = '';
            this.cdRef.detectChanges();
          }, 3000);
        }
      });
  }
  
  private onItemDeleted(ids: string[]) {
    // this.getItems(['/'], false)
    //   .pipe(take(1))
    //   .subscribe((rootMenu) => (this.streamsCount = rootMenu.totalCount || rootMenu.childrenCount));
    this.menu.forEach((item, index) => {
      if (ids.includes(item.id)) {
        this.leftSidebarStorageService.updatePath((paths) =>
          paths.filter((path) => path.startsWith(`/${encodeURIComponent(item.id)}`)),
        ).subscribe();
        this.menu.splice(index, 1);
      }
    });
    this.addMeta();
    this.makeFlatMenu();
    this.cdRef.detectChanges();
  }
  
  private onStreamChanged(streams: string[]) {
    const indexes = this.menu
      ?.map((item, index) => (streams.includes(item.id) ? index : null))
      .filter((i) => i !== null);
    if (indexes?.length !== streams.length) {
      timer(100).subscribe(() => this.onStreamChanged(streams));
      return;
    }
    
    this.freshStreams(indexes);
  }
  
  private freshStreams(indexes: number[]) {
    const menuItems = indexes.map((index) => ({item: this.menu[index], index}));
    const menuItemsPaths = menuItems.map(({item: {id}}) => `/${encodeURIComponent(id)}`);
    this.leftSidebarStorageService.getStoragePaths().pipe(
      map(allPaths => allPaths.filter(path => menuItemsPaths.find(mPath => path.startsWith(mPath)))),
      switchMap(requestPaths => this.getItems(
        [...menuItemsPaths, ...requestPaths],
        false,
      )),
      take(1),
    ).subscribe((responseItem) => {
      menuItems.forEach(({item, index}) => {
        const open = item.children?.length > 0;
        const itemIndex = responseItem.children?.findIndex((child) => child.id === item.id);
        const itemInResponse = responseItem.children[itemIndex];
        if (itemIndex > -1) {
          if (!open) {
            item.childrenCount = itemInResponse.children.length;
            item.viewMd = itemInResponse.viewMd;
          } else {
            this.menu[index] = itemInResponse;
          }
          
          this.addMeta();
          this.makeFlatMenu();
          this.cdRef.detectChanges();
        }
      });
    });
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
  
  private addMeta(
    items: MenuItem[] = null,
    stream = null,
    space = null,
    symbol = null,
    chartType = null,
    isView = false,
  ) {
    const targetItems = items || this.menu;
    targetItems.forEach((item) => {
      if (item.type === MenuItemType.stream || item.type === MenuItemType.view) {
        stream = item;
        chartType = item.chartType;
      }
      
      isView = isView || item.type === MenuItemType.view;
      
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
        chartType: chartType || [],
        isView,
      };
      
      if (item.children?.length) {;
        this.addMeta(item.children, stream, space, symbol, chartType, isView);
      }
    });
  }
  
  switchTreeView(id: string) {
    this.treeViewId = id;
    this.leftSidebarStorageService.updateStorageItem('treeView', id);
  }
  
  trackMenuItem(index, menuItem: MenuItem) {
    return JSON.stringify({id: menuItem.id, name: menuItem.name, type: menuItem.type, path: menuItem.path});
  }
}
