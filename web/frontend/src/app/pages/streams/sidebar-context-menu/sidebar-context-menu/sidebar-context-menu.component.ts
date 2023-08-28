import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {BsModalService}                           from 'ngx-bootstrap/modal';
import {BsModalRef}                               from 'ngx-bootstrap/modal/bs-modal-ref.service';
import {ModalOptions}                             from 'ngx-bootstrap/modal/modal-options.class';
import {ContextMenuComponent, ContextMenuService} from '@perfectmemory/ngx-contextmenu';
import {merge, Observable, ReplaySubject}         from 'rxjs';
import {take, takeUntil}                          from 'rxjs/operators';
import {AppState}                                 from '../../../../core/store';
import {ConfirmModalComponent}                    from '../../../../shared/components/modals/modal-on-close-alert/confirm-modal.component';
import {ExportFilterFormat}                       from '../../../../shared/models/export-filter';
import {MenuItem}                                 from '../../../../shared/models/menu-item';
import {PermissionsService}                       from '../../../../shared/services/permissions.service';
import { ViewsService }                           from '../../../../shared/services/views.service';
import {ModalDescribeComponent}                   from '../../components/modals/modal-describe/modal-describe.component';
import {ModalExportFileComponent}                 from '../../components/modals/modal-export-file/modal-export-file.component';
import {ModalImportQSMSGFileComponent}                 from '../../components/modals/modal-import-QSMSG-file/modal-import-QSMSG-file.component';
import {ModalPurgeComponent}                      from '../../components/modals/modal-purge/modal-purge.component';
import {ModalRenameComponent}                     from '../../components/modals/modal-rename/modal-rename.component';
import {ModalSendMessageComponent}                from '../../components/modals/modal-send-message/modal-send-message.component';
import {ModalStreamChartComponent}                from '../../components/modals/modal-stream-chart/modal-stream-chart.component';
import {ModalTruncateComponent}                   from '../../components/modals/modal-truncate/modal-truncate.component';
import {ChartTypes}                               from '../../models/chart.model';
import * as StreamsActions                        from '../../store/streams-list/streams.actions';
import {SidebarContextMenuService} from '../sidebar-context-menu.service';
import { ModalImportCSVFileComponent } from '../../components/modals/modal-import-csv-file/modal-import-csv-file.component';
import { ImportFromTextFileService } from '../../services/import-from-text-file.service';
import { StreamsService } from 'src/app/shared/services/streams.service';

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
  isView: boolean;
  isNotStream: boolean;
  isSpace: boolean;
  isNotStreamOrSpace: boolean;
  hasPricesL2Chart: boolean;
  isWriter$: Observable<boolean>;
  @ViewChild('deleteItemMessage') private deleteItemMessage: TemplateRef<HTMLElement>;
  private destroy$ = new ReplaySubject(1);

  constructor(
    private translateService: TranslateService,
    private modalService: BsModalService,
    private appStore: Store<AppState>,
    private contextMenuService: ContextMenuService,
    private sidebarContextMenuService: SidebarContextMenuService,
    private permissionsService: PermissionsService,
    private cdRef: ChangeDetectorRef,
    private viewsService: ViewsService,
    private importFromTextFileService: ImportFromTextFileService,
    private streamsService: StreamsService
  ) {}

  ngOnInit(): void {
    this.isWriter$ = this.permissionsService.isWriter();

    this.sidebarContextMenuService
      .onOpenMenu()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({event, item}) => {
        this.item = item;
        const queryParams = {
          chartType: this.item.meta.chartType.map(ct => ct.chartType),
          chartTypeTitles: this.item.meta.chartType.map(ct => ct.title),
          streamName: this.item.meta.stream.name,
          isView: this.item.meta.isView ? '1' : '',
        };
        this.queryParams = this.item?.meta.space
          ? {...queryParams, space: this.item.meta.space.id || ''}
          : queryParams;
        this.newTabQueryParams = {...this.queryParams, newTab: '1'};
        this.isRootSpace = this.item.meta.space && this.item.meta.space.id === '';
        this.isView = this.item.meta.isView;
        this.isNotStream = !(this.item && !this.item.meta.symbol);
        this.isNotStreamOrSpace = this.isNotStream || !!this.item.meta.space;
        this.isSpace = !!this.item.meta.space && !this.item.meta.symbol;
        this.hasPricesL2Chart = !!this.item.meta.chartType?.find(ct => ct.chartType === ChartTypes.PRICES_L2);
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
        messageTpl: this.deleteItemMessage,
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

        if (!this.isView) {
          this.appStore.dispatch(
            new StreamsActions.AskToDeleteStream({
              streamKey: this.item.meta.stream.id,
              ...(this.item.meta.space ? {spaceName: this.item.meta.space.id} : {}),
            }),
          );
          this.streamsService.streamRemoved.next(this.item.meta.stream.id);
        } else {
          this.viewsService.delete(this.item.meta.stream.name).subscribe();
        }
       
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
      initialState: {stream: this.item.meta.stream, view: this.item.viewMd},
      ignoreBackdropClick: true,
      class: 'wide-modal scroll-content-modal',
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

  importFromQSMSG() {
    this.openModal(ModalImportQSMSGFileComponent, {
      class: 'scroll-content-modal',
      ignoreBackdropClick: true,
      initialState: {stream: this.item.meta.stream.id},
    });
  }

  importFromCSV() {
    this.importFromTextFileService.setStreamId(this.item.meta.stream.id);
    this.openModal(ModalImportCSVFileComponent, {
      class: 'modal-xl',
      ignoreBackdropClick: true,
      initialState: {stream: this.item.meta.stream.name},
    });
  }

  openStreamChartModal() {
    if (!this.item.chartType?.length) {
      return;
    }
    
    this.openModal(ModalStreamChartComponent, {
      initialState: {item: this.item},
    });
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
      initialState: {
        stream: this.item.meta.stream,
        exportFormat,
        symbols: this.item.meta.symbol ? [this.item.meta.symbol] : null,
      },
      class: 'scroll-content-modal',
    });
  }

  private openModal(content: string | TemplateRef<any> | any, options: ModalOptions): BsModalRef {
    if (!this.item?.meta.stream?.id) return;

    this.closeContextMenu();
    return this.modalService.show(content, options);
  }
}
