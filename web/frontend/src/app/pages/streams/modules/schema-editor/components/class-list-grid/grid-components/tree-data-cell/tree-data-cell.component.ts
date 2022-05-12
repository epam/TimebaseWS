import {Component, OnDestroy} from '@angular/core';
import {ICellRendererAngularComp} from 'ag-grid-angular';
import {GridApi, ICellRendererParams} from 'ag-grid-community';
import {Subject} from 'rxjs';
import {SchemaClassTypeModel} from 'src/app/shared/models/schema.class.type.model';

@Component({
  selector: 'app-tree-data-cell',
  templateUrl: './tree-data-cell.component.html',
  styleUrls: ['./tree-data-cell.component.scss'],
})
export class TreeDataCellComponent implements ICellRendererAngularComp, OnDestroy {
  public typeItem: SchemaClassTypeModel;
  public params: ICellRendererParams;
  private gridApi: GridApi;
  private destroy$ = new Subject();

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.gridApi = params.api;
    this.typeItem = params.data;
  }

  refresh(params: any): boolean {
    return false;
  }

  public onShowHideChildren(visibility: boolean) {
    const SET_CHILDREN_VISIBILITY = (parentNode, _visibility) => {
      if (parentNode.data._props?._children) {
        parentNode.setData({
          ...parentNode.data,
          _props: {
            ...parentNode.data._props,
            _showChildren: _visibility,
          },
        });
        parentNode.data._props._children.forEach((children_name) => {
          const CHILDREN_ROW_NODE = this.gridApi.getRowNode(children_name);
          if (CHILDREN_ROW_NODE) {
            CHILDREN_ROW_NODE.setData({
              ...CHILDREN_ROW_NODE.data,
              _props: {
                ...CHILDREN_ROW_NODE.data._props,
                _isVisible: _visibility,
              },
            });
            CHILDREN_ROW_NODE.setRowHeight(!_visibility ? 0 : null);

            if (Boolean(CHILDREN_ROW_NODE.data?._props?._children) && !_visibility) {
              SET_CHILDREN_VISIBILITY(CHILDREN_ROW_NODE, _visibility);
            }
          }
        });
      }
    };

    SET_CHILDREN_VISIBILITY(this.params.node, visibility);
    this.gridApi.redrawRows();
    this.gridApi.refreshClientSideRowModel();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
