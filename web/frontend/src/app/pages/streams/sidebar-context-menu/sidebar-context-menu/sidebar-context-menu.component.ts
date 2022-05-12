import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Store }                                                                          from '@ngrx/store';
import { TranslateService }                                                               from '@ngx-translate/core';
import { BsModalService }                                                                 from 'ngx-bootstrap/modal';
import { BsModalRef }                                                                     from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { ModalOptions }                                                                   from 'ngx-bootstrap/modal/modal-options.class';
import { ContextMenuComponent, ContextMenuService }                                       from 'ngx-contextmenu';
import { merge, Observable, ReplaySubject }                                               from 'rxjs';
import { take, takeUntil }                                                                from 'rxjs/operators';
import { AppState }                                                                       from '../../../../core/store';
import { ConfirmModalComponent }                                                          from '../../../../shared/components/modals/modal-on-close-alert/confirm-modal.component';
import { ExportFilterFormat }                                                             from '../../../../shared/models/export-filter';
import { MenuItem }                                                                       from '../../../../shared/models/menu-item';
import { PermissionsService }                                                             from '../../../../shared/services/permissions.service';
import { ModalDescribeComponent }                                                         from '../../components/modals/modal-describe/modal-describe.component';
import { ModalExportFileComponent }                                                       from '../../components/modals/modal-export-file/modal-export-file.component';
import { ModalPurgeComponent }                                                            from '../../components/modals/modal-purge/modal-purge.component';
import { ModalRenameComponent }                                                           from '../../components/modals/modal-rename/modal-rename.component';
import { ModalSendMessageComponent }                                                      from '../../components/modals/modal-send-message/modal-send-message.component';
import { ModalTruncateComponent }                                                         from '../../components/modals/modal-truncate/modal-truncate.component';
import { ChartTypes }                                                                     from '../../models/chart.model';
import * as StreamsActions
                                                                                          from '../../store/streams-list/streams.actions';
import { SidebarContextMenuService }                                                      from '../sidebar-context-menu.service';

@Component({
  selector: 'app-sidebar-context-menu',
  templateUrl: './sidebar-context-menu.component.html',
  styleUrls: ['./sidebar-context-menu.component.scss'],
})
export class SidebarContextMenuComponent implements OnInit, OnDestroy {
  @ViewChild(ContextMenuComponent) public listMenu: ContextMenuComponent;
  @Input() activeTabType: string;
  queryParams: {[index: string]: string | string[]};
  newTabQueryParams: {[index: string]: string};
  item: MenuItem;
  isRootSpace: boolean;
  isNotStream: boolean;
  isNotStreamOrSpace: boolean;
  hasPricesL2Chart: boolean;
  isWriter$: Observable<boolean>;
  @ViewChild('deleteStreamMessage') private deleteStreamMessage: TemplateRef<HTMLElement>;
  private destroy$ = new ReplaySubject(1);

  constructor(
    private translateService: TranslateService,
    private modalService: BsModalService,
    private appStore: Store<AppState>,
    private contextMenuService: ContextMenuService,
    private sidebarContextMenuService: SidebarContextMenuService,
    private permissionsService: PermissionsService,
    private cdRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.isWriter$ = this.permissionsService.isWriter();

    this.sidebarContextMenuService
      .onOpenMenu()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({event, item}) => {
        this.item = item;
        const queryParams = {chartType: this.item.meta.chartType};
        this.queryParams = this.item?.meta.space
          ? {...queryParams, space: this.item.meta.space.id || ''}
          : queryParams;
        this.newTabQueryParams = {...this.queryParams, newTab: '1'};
        this.isRootSpace = this.item.meta.space && this.item.meta.space.id === '';
        this.isNotStream = !(this.item && !this.item.meta.symbol);
        this.isNotStreamOrSpace = this.isNotStream || !!this.item.meta.space;
        this.hasPricesL2Chart = this.item.meta.chartType?.includes(ChartTypes.PRICES_L2);
        this.cdRef.detectChanges();

        this.contextMenuService.show.next({
          contextMenu: this.listMenu,
          event: event,
          item: item,
        });

        merge(this.contextMenuService.close, this.contextMenuService.show)
          .pipe(take(1))
          .subscribe(() => {
            this.sidebarContextMenuService.menuWasClosed();
          });

        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      });

    this.sidebarContextMenuService
      .onCloseMenu()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeContextMenu());
  }

  showTruncateModal() {
    this.openModal(ModalTruncateComponent, {
      initialState: {
        stream: this.item,
      },
      ignoreBackdropClick: true,
    });
  }

  showPurgeModal() {
    this.openModal(ModalPurgeComponent, {
      initialState: {
        stream: this.item,
      },
      ignoreBackdropClick: true,
    });
  }

  confirmDeleteStream() {
    this.openModal(ConfirmModalComponent, {
      initialState: {
        messageTpl: this.deleteStreamMessage,
        withoutHeader: true,
        btns: {yes: 'buttons.delete', no: 'buttons.cancel'},
      },
      class: 'modal-small',
    })
      .content.resolve.pipe(take(1))
      .subscribe((confirm) => {
        if (!confirm || !this.item?.id) {
          return;
        }

        this.appStore.dispatch(
          new StreamsActions.AskToDeleteStream({
            streamKey: this.item.meta.stream.id,
            ...(this.item.meta.space ? {spaceName: this.item.meta.space.id} : {}),
          }),
        );
      });
  }

  showEditNameModal() {
    this.openModal(ModalRenameComponent, {
      initialState: {data: this.item.meta},
      ignoreBackdropClick: true,
    });
  }

  showDescribe() {
    this.openModal(ModalDescribeComponent, {
      initialState: {stream: this.item.meta.stream},
      ignoreBackdropClick: true,
    });
  }

  showSendMessage() {
    this.openModal(ModalSendMessageComponent, {
      initialState: {stream: this.item.meta.stream},
      ignoreBackdropClick: true,
      class: 'modal-message scroll-content-modal',
    });
  }

  exportQSMSGFile() {
    this.exportToFile(ExportFilterFormat.QSMSG);
  }

  exportCsv() {
    this.exportToFile(ExportFilterFormat.CSV);
  }

  closeContextMenu() {
    this.contextMenuService.closeAllContextMenus({eventType: 'cancel'});
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private exportToFile(exportFormat: ExportFilterFormat) {
    this.openModal(ModalExportFileComponent, {
      initialState: {stream: this.item, exportFormat},
      class: 'scroll-content-modal',
    });
  }

  private openModal(content: string | TemplateRef<any> | any, options: ModalOptions): BsModalRef {
    if (!this.item?.meta.stream?.id) return;

    this.closeContextMenu();
    return this.modalService.show(content, options);
  }
}
