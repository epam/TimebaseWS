import { Component, OnInit }          from '@angular/core';
import { select, Store }              from '@ngrx/store';
import { StorageMap }                 from '@ngx-pwa/local-storage';
import { BsModalService }             from 'ngx-bootstrap/modal';
import { ContextMenuService }         from '@perfectmemory/ngx-contextmenu';
import { Observable }                 from 'rxjs';
import { map, take }                  from 'rxjs/operators';
import { AppState }                   from '../../../../core/store';
import { getAppInfo }                 from '../../../../core/store/app/app.selectors';
import { GlobalResizeService }        from '../../../../shared/services/global-resize.service';
import { LeftSidebarStorageService }  from '../../../../shared/services/left-sidebar-storage.service';
import { PermissionsService }         from '../../../../shared/services/permissions.service';
import { CreateStreamModalComponent } from '../modals/create-stream-modal/create-stream-modal.component';
import { CreateViewModalComponent }   from '../modals/create-view/create-view-modal.component';
import { ModalImportQSMSGFileComponent }   from '../modals/modal-import-QSMSG-file/modal-import-QSMSG-file.component';
import * as StreamsActions            from '../../store/streams-list/streams.actions';

@Component({
  selector: 'app-left-sidebar',
  templateUrl: './left-sidebar.component.html',
  styleUrls: ['./left-sidebar.component.scss'],
})
export class LeftSidebarComponent implements OnInit {
  
  menuSmall = false;
  isWriter$: Observable<boolean>;
  version$: Observable<string>;
  
  constructor(
    private globalResizeService: GlobalResizeService,
    private storage: StorageMap,
    private permissionsService: PermissionsService,
    private bsModalService: BsModalService,
    private contextMenuService: ContextMenuService,
    private appStore: Store<AppState>,
    private leftSidebarStorageService: LeftSidebarStorageService,
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
  }
  
  toggleMenu() {
    this.menuSmall = !this.menuSmall;
    this.updateMenuSmall(this.menuSmall);
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
    });
  }
  
  createView() {
    this.bsModalService.show(CreateViewModalComponent, {
      ignoreBackdropClick: true,
      class: 'modal-xl',
    });
  }
  
  onCloseContextMenu() {
    this.contextMenuService.closeAllContextMenus({eventType: 'cancel'});
  }

  closeOtherDropdowns() {
    if (this.leftSidebarStorageService.dropdownsOpened.includes('create-stream-dropdown')) {
      this.leftSidebarStorageService.removeOpenedDropdown('create-stream-dropdown');
    } else {
      this.leftSidebarStorageService.addOpenedDropdown('create-stream-dropdown');
      this.onCloseContextMenu();
      if (this.leftSidebarStorageService.dropdownsOpened.includes('search-options-dropdown')) {
        (document.querySelector('.search-options-toggle-btn') as HTMLElement).click();
        this.leftSidebarStorageService.removeOpenedDropdown('search-options-dropdown');
      }
    }
  }
  
  onImportFromQMSG() {
    this.bsModalService.show(ModalImportQSMSGFileComponent, {
      class: 'scroll-content-modal',
      ignoreBackdropClick: true,
    });
    this.onCloseContextMenu();
  }
}
