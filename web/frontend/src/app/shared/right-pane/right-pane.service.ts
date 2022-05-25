import { Injectable, OnDestroy }                                  from '@angular/core';
import { select, Store }                                          from '@ngrx/store';
import { CellClickedEvent, Column, GridOptions, RowClickedEvent } from 'ag-grid-community';
import { combineLatest, Observable, ReplaySubject, Subject }      from 'rxjs';
import { filter, map, take, takeUntil }                           from 'rxjs/operators';
import { AppState }                                               from '../../core/store';
import { StreamDetailsModel }                                     from '../../pages/streams/models/stream.details.model';
import { getActiveTabFilters }                                    from '../../pages/streams/store/streams-tabs/streams-tabs.selectors';
import { TabStorageService }                                      from '../services/tab-storage.service';
import { HasRightPanel }                                          from './has-right-panel';

@Injectable()
export class RightPaneService implements OnDestroy {
  private columns$ = new ReplaySubject<Column[]>(1);
  private readyApi: GridOptions;
  private destroy$ = new Subject();

  constructor(
    private tabStorageService: TabStorageService<HasRightPanel>,
    private appStore: Store<AppState>,
  ) {}

  setGridApi(readyApi: GridOptions) {
    this.destroy$.next();
    this.readyApi = readyApi;
    this.columns$.next(this.readyApi.columnApi.getAllColumns());
    this.tabStorageService
      .flow('rightPanel')
      .getDataSync(['selectedMessage'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((storage) => {
        this.readyApi.api.setPinnedTopRowData(
          storage?.selectedMessage ? [storage.selectedMessage] : [],
        );
        this.checkSelected();
      });
  }

  checkSelected() {
    combineLatest([this.tabStorageService.flow('rightPanel').getDataSync(), this.fromFilter()])
      .pipe(take(1))
      .subscribe(([storage, from]) => {
        if (storage?.from !== from) {
          return;
        }
        this.readyApi.api.forEachNode((node, index) => {
          node.setSelected(index === storage?.rowIndex);
        });
      });
  }

  onColumns(): Observable<Column[]> {
    return this.columns$.asObservable();
  }

  onShowProps(): Observable<boolean> {
    return this.tabStorageService
      .flow('rightPanel')
      .getData(['showProps'], true, false)
      .pipe(map((data) => !!data?.showProps));
  }

  onShowSelectedMessage(): Observable<boolean> {
    return this.tabStorageService
      .flow('rightPanel')
      .getData(['showMessageInfo'], true, false)
      .pipe(map((data) => !!data?.showMessageInfo));
  }

  onPinnedRowDataChanged(forceOpen = false) {
    if (!this.readyApi) {
      return;
    }

    const PINNED_ROW = this.readyApi.api.getPinnedTopRow(0);
    this.tabStorageService.flow('rightPanel').updateDataSync((data) => {
      const selectedMessage = PINNED_ROW?.data ? {...PINNED_ROW?.data} : null;
      if (selectedMessage) {
        delete selectedMessage.original;
      }

      return {
        ...(data || {}),
        selectedMessage,
        rowIndex: PINNED_ROW ? data.rowIndex : null,
        showProps: forceOpen ? false : data?.showProps,
        messageView: PINNED_ROW ? data.messageView : null,
        showMessageInfo:
          data?.showMessageInfo === undefined || forceOpen ? !!PINNED_ROW : data?.showMessageInfo,
      };
    });
  }

  tabChanged() {
    this.tabStorageService
      .flow('rightPanel')
      .getDataSync()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe((storageData) => {
        const selected = storageData?.selectedMessage ? [storageData?.selectedMessage] : [];
        this.readyApi?.api.setPinnedTopRowData(selected);
      });
  }

  cellClicked(click: CellClickedEvent | RowClickedEvent) {
    this.tabStorageService.flow('rightPanel').updateDataSync((data) => {
      return {...data, rowIndex: click.rowIndex};
    });
    this.updateFrom();

    if (this.readyApi.api.getPinnedTopRow(0)?.data) {
      this.readyApi.api.setPinnedTopRowData([click.data]);
    }
  }

  doubleClicked(message: StreamDetailsModel) {
    this.readyApi.api.setPinnedTopRowData([message]);
    this.updateFrom();
    this.onPinnedRowDataChanged(true);
  }

  closeRightPanel() {
    this.tabStorageService
      ?.flow('rightPanel')
      .updateDataSync((data) => ({...(data || {}), showProps: false, showMessageInfo: false}));
  }

  clearSelectedMessage() {
    this.readyApi?.api.setPinnedTopRowData([]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateFrom() {
    this.fromFilter()
      .pipe(take(1))
      .subscribe((from) => {
        this.tabStorageService.flow('rightPanel').updateDataSync((data) => {
          return {...data, from};
        });
      });
  }

  private fromFilter(): Observable<string> {
    return this.appStore.pipe(
      select(getActiveTabFilters),
      filter((f) => !!f),
      map((filters) => filters.from),
    );
  }
}
