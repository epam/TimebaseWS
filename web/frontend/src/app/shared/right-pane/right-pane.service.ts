import { Injectable, OnDestroy }                                  from '@angular/core';
import { select, Store }                                          from '@ngrx/store';
import { CellClickedEvent, Column, GridOptions, RowClickedEvent } from 'ag-grid-community';
import { combineLatest, Observable, ReplaySubject, Subject } from 'rxjs';
import { filter, map, switchMap, take, takeUntil, tap }      from 'rxjs/operators';
import { AppState }                                          from '../../core/store';
import { ChartTypes }                                             from '../../pages/streams/models/chart.model';
import { FilterModel }                                            from '../../pages/streams/models/filter.model';
import { StreamDetailsModel }                                     from '../../pages/streams/models/stream.details.model';
import { getActiveTabFilters }                                    from '../../pages/streams/store/streams-tabs/streams-tabs.selectors';
import { TabStorageService }                                      from '../services/tab-storage.service';
import { HasRightPanel }                                          from './has-right-panel';

@Injectable()
export class RightPaneService implements OnDestroy {
  private columns$ = new ReplaySubject<Column[]>(1);
  private readyApi: GridOptions;
  private destroy$ = new Subject();
  private allProps = [
    'showProps',
    'showMessageInfo',
    'showViewInfo',
    'showChartSettings',
    'showDescription',
    'showFlowNode',
  ];
  
  constructor(
    private tabStorageService: TabStorageService<unknown>,
    private appStore: Store<AppState>,
  ) {}
  
  setGridApi(readyApi: GridOptions) {
    this.destroy$.next();
    this.readyApi = readyApi;
    this.columns$.next(this.readyApi.columnApi.getAllColumns());
    this.tabStorageService
      .flow<HasRightPanel>('rightPanel')
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
    combineLatest([this.tabStorageService.flow<HasRightPanel>('rightPanel').getDataSync(), this.fromFilter()])
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
    return this.observeProp(this.allProps[0]);
  }
  
  onShowSelectedMessage(): Observable<boolean> {
    return this.observeProp(this.allProps[1]);
  }
  
  onShowChartSettings(): Observable<boolean> {
    return this.observeProp(this.allProps[3]);
  }
  
  onShowDescription(): Observable<boolean> {
    return this.observeProp(this.allProps[4]);
  }
  
  onShowAny(): Observable<boolean> {
    return combineLatest(this.allProps.map(prop => this.observeProp(prop))).pipe(map(showProps => !!showProps.find(p => !!p)));
  }
  
  onPinnedRowDataChanged(forceOpen = false) {
    if (!this.readyApi) {
      return;
    }
    
    const PINNED_ROW = this.readyApi.api.getPinnedTopRow(0);
    this.tabStorageService.flow<HasRightPanel>('rightPanel').updateDataSync((data) => {
      const selectedMessage = PINNED_ROW?.data ? {...PINNED_ROW?.data} : null;
      if (selectedMessage) {
        delete selectedMessage.original;
      }
      
      return {
        ...(data || {}),
        selectedMessage,
        rowIndex: PINNED_ROW ? data.rowIndex : null,
        showProps: forceOpen ? false : data?.showProps,
        showViewInfo: forceOpen ? false : data?.showViewInfo,
        showDescription: forceOpen ? false : data?.showDescription,
        messageView: PINNED_ROW ? data.messageView : null,
        showMessageInfo:
          data?.showMessageInfo === undefined || forceOpen ? !!PINNED_ROW : data?.showMessageInfo,
      };
    });
  }
  
  tabChanged() {
    this.tabStorageService
      .flow<HasRightPanel>('rightPanel')
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
  
  viewOrderBook(message: StreamDetailsModel, rowIndex: number) {
    this.fromFilter()
      .pipe(
        take(1),
        switchMap((from) =>
          this.tabStorageService
            .flow('rightPanel')
            .updateData((data) => ({...data, messageView: 'orderBook', from, rowIndex})),
        ),
      )
      .subscribe(() => {
        this.doubleClicked(message);
        this.checkSelected();
      });
  }
  
  closeRightPanel() {
    const propsUpdate = {};
    this.allProps.forEach(p => propsUpdate[p] = false);
    this.tabStorageService
      ?.flow('rightPanel')
      .updateDataSync((data) => ({...(data || {}), ...propsUpdate}));
  }
  
  clearSelectedMessage() {
    this.readyApi?.api.setPinnedTopRowData([]);
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  observeProp(key: string): Observable<boolean> {
    const storageObj$ = this.tabStorageService
      .flow('rightPanel')
      .getData([key], true, false)
      .pipe(map((data) => !!data?.[key]));
    
    if (key === this.allProps[3]) {
      return combineLatest([
        this.activeFilter(),
        storageObj$,
      ]).pipe(
        map(([filter, prop]) => filter.chart_type === ChartTypes.LINEAR && prop),
      );
    }
    
    return storageObj$;
  }
  
  toggleProp(key: string, state = null) {
    this.tabStorageService.flow('rightPanel').updateDataSync((data) => {
      const update = data || {};
      this.allProps.forEach(k => {
        if (k !== key) {
          update[k] = false;
        } else {
          update[k] = state === null ? !update[k] : state;
        }
      });
      return {
        ...data,
        ...update,
      };
    });
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
    return this.activeFilter().pipe(
      map((filters) => filters.from),
    );
  }
  
  private activeFilter(): Observable<FilterModel> {
    return this.appStore.pipe(
      select(getActiveTabFilters),
      filter((f) => !!f),
    );
  }
}
