import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { select, Store }                           from '@ngrx/store';
import { AgGridModule }                            from 'ag-grid-angular';
import { GridApi, GridOptions, GridReadyEvent }    from 'ag-grid-community';
import { Subject, timer }                          from 'rxjs';
import { filter, take, takeUntil }                 from 'rxjs/operators';
import { AppState }                                from '../../../../../../../core/store';
import { GridContextMenuService }                  from '../../../../../../../shared/grid-components/grid-context-menu.service';
import { FieldTypeModel }                          from '../../../../../../../shared/models/schema.class.type.model';
import {
  autosizeAllColumns,
  columnsVisibleColumn,
  defaultGridOptions,
}                                                  from '../../../../../../../shared/utils/grid/config.defaults';
import { ClassDescriptorChangeModel }              from '../../../models/stream.meta.data.change.model';
import { getSchemaDiff }                           from '../../../store/schema-editor.selectors';

export interface GridRowDataModel {
  groupName: string;
  name: string;
  status: string;
  resolution: 'None' | 'DataConvert' | 'DataLoss';
  _props: {
    hasErrors: boolean;
    defaultValueRequired?: boolean;
    dataType?: FieldTypeModel;
    nullable?: boolean;
  };
}

@Component({
  selector: 'app-diff-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss'],
  providers: [GridContextMenuService],
})
export class GridComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();

  public gridOptions: GridOptions;
  public gridApi: GridApi;
  @ViewChild('diffGrid', {static: true}) agGrid: AgGridModule;
  private gridDefaults: GridOptions = {
    ...defaultGridOptions,
    rowBuffer: 10,
    enableFilter: true,
    enableSorting: true,
    suppressCellSelection: true,
    autoGroupColumnDef: {
      minWidth: 200,
    },
    groupDefaultExpanded: -1,
    suppressRowClickSelection: true,
    suppressScrollOnNewData: true,
    gridAutoHeight: false,
    onGridReady: (readyEvent: GridReadyEvent) => this.gridIsReady(readyEvent),
    getRowNodeId: (row) => {
      return row.groupName + row.name;
    },
    getRowHeight: ({data}) => {
      return data && data._props && data._props.hasErrors ? 102 : 28;
    },
  };

  constructor(
    private appStore: Store<AppState>,
    private gridContextMenuService: GridContextMenuService,
  ) { }

  ngOnInit() {
    this.gridOptions = this.gridDefaults;
    this.gridContextMenuService.disableColumns();
  }

  gridIsReady(readyEvent: GridReadyEvent) {
    this.gridApi = readyEvent.api;
    this.setColumns(this.gridApi);
    this.appStore
      .pipe(
        select(getSchemaDiff),
        filter(diff => !!diff),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe(diff => {
        const data = this.gridDataConverter(diff.changes);
        this.gridApi.setRowData(data);
        timer().subscribe(() => autosizeAllColumns(readyEvent.columnApi));
      });
  }

  private setColumns(gridApi) {
    gridApi.setColumnDefs([
      columnsVisibleColumn(false),
      {
        field: 'groupName',
        rowGroupIndex: 0,
        hide: true,
        rowGroup: true,
      },
      {
        headerName: 'Name',
        field: 'name',
      },
      {
        headerName: 'Status',
        field: 'status',
        cellStyle: {'white-space': 'pre-wrap'},
        width: 340,
      },
      {
        headerName: 'Resolution',
        field: 'resolution',
        cellRenderer: 'resolutionComponent',
        width: 200,
      },
    ]);
  }

  private gridDataConverter(changes: ClassDescriptorChangeModel[]): GridRowDataModel[] {
    const convertedChanges = [];
    changes.forEach((change: ClassDescriptorChangeModel) => {
      convertedChanges.push(...change.fieldChanges.map((field): GridRowDataModel => {
        const CHANGE_SOURCE = change.target || change.source,
          FIELD_SOURCE = field.target || field.source;
        return {
          groupName: CHANGE_SOURCE.name,
          name: FIELD_SOURCE.name,
          status: field.status,
          resolution: field.changeImpact,
          _props: {
            hasErrors: field.hasErrors,
            ...(field.defaultValue === null && field.defaultValueRequired ? {defaultValueRequired: true} : {}),
            dataType: FIELD_SOURCE.type,
            nullable: FIELD_SOURCE.type.nullable,
          },
        };
      }));
    });
    return convertedChanges;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
