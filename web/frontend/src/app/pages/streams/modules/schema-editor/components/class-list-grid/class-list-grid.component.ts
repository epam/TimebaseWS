import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators }                               from '@angular/forms';
import { ActivatedRoute }                                                   from '@angular/router';
import { select, Store }                                                    from '@ngrx/store';
import { GridOptions, SelectionChangedEvent }                               from 'ag-grid-community';
import { BsModalRef, BsModalService }                                       from 'ngx-bootstrap';
import { Observable, Subject }                                              from 'rxjs';
import { filter, map, switchMap, take, takeUntil, tap }                     from 'rxjs/operators';
import { AppState }                                                         from '../../../../../../core/store';
import { GridContextMenuService }                                           from '../../../../../../shared/grid-components/grid-context-menu.service';
import { SchemaClassTypeModel }                                             from '../../../../../../shared/models/schema.class.type.model';
import { GridService }                                                      from '../../../../../../shared/services/grid.service';
import { columnsVisibleColumn }                                             from '../../../../../../shared/utils/grid/config.defaults';
import { uniqueName }                                                       from '../../../../../../shared/utils/validators';
import { SeDataService }                                                    from '../../services/se-data.service';
import { SeFieldFormsService }                                              from '../../services/se-field-forms.service';
import { SeSelectionService }                                               from '../../services/se-selection.service';
import {
  ChangeClassName,
  ChangeEnumName,
  ChangeSchemaItem,
  SetSelectedSchemaItem,
}                                                                           from '../../store/schema-editor.actions';
import { getAllSchemaItems }                                                from '../../store/schema-editor.selectors';

@Component({
  selector: 'app-class-list-grid',
  templateUrl: './class-list-grid.component.html',
  styleUrls: ['./class-list-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GridService, GridContextMenuService],
})

export class ClassListGridComponent implements OnInit, OnDestroy {
  @ViewChild('editItemModalTemplate', {static: true}) modalTemplate;
  schemaAll = [];
  editTypeItemForm: FormGroup;
  editItemModalRef: BsModalRef;
  editItemModalState: SchemaClassTypeModel;
  gridOptions$: Observable<GridOptions>;
  
  private destroy$ = new Subject();
  private columnsSet = false;
  
  constructor(
    private appStore: Store<AppState>,
    private fb: FormBuilder,
    private modalService: BsModalService,
    private gridService: GridService,
    private activatedRoute: ActivatedRoute,
    private seFieldFormsService: SeFieldFormsService,
    private seDataService: SeDataService,
    private seSelectionService: SeSelectionService,
    private gridContextMenuService: GridContextMenuService,
  ) {
  }
  
  ngOnInit() {
    this.gridContextMenuService.disableColumns();
    this.gridOptions$ = this.tabId().pipe(map(id => {
      return this.gridService.options(id, {
        enableFilter: false,
        deltaRowDataMode: true,
        getRowNodeId: ({name}) => name,
        getRowStyle: (params) => {
          return {'display': params?.data?._props?._isVisible ? 'block' : 'none'};
        },
        rowClassRules: {
          'classItem': ({data}) => data && !data.isEnum,
          'enumItem': ({data}) => data?.isEnum,
          'type-edited': ({data}) => this.seFieldFormsService.typeHasChanges(data),
          'hasError': ({data}) => this.seFieldFormsService.showErrorOnType(data),
          'ag-row-selected': ({data}) => data?._props?._isSelected,
        },
      });
    }));
    
    const columns = [
      columnsVisibleColumn(false),
      {
        headerName: 'Use',
        field: '_props._isUsed',
        filter: false,
        cellRenderer: 'isUsedCbComponent',
        pinned: 'left',
        sortable: false,
        lockPosition: true,
        suppressMenu: true,
      },
      {
        sortable: true,
        lockPosition: true,
        suppressMenu: true,
        cellRenderer: 'treeDataCellComponent',
        field: 'name',
        filter: 'agTextColumnFilter',
        headerName: 'Name',
        cellClass: ({data}) => data?._props?._isEdited ? 'isEdited' : '',
      },
      {
        headerName: 'Title',
        field: 'title',
        filter: true,
        width: 100,
        sortable: false,
        lockPosition: true,
        suppressMenu: true,
      },
      {
        headerName: 'Abstract',
        field: 'isAbstract',
        filter: false,
        cellRenderer: 'isAbstractCbComponent',
        sortable: false,
        lockPosition: true,
        suppressMenu: true,
      },
    ];
    
    const data$ = this.appStore.pipe(
      select(getAllSchemaItems),
      map(schemaAll => {
        if (schemaAll && schemaAll.length) {
          this.schemaAll = [...schemaAll];
        }
        
        const rowData = [...schemaAll];
        
        for (const row of rowData) {
          if (row.isEnum) {
            row._props._hierarchy = ['Enumerators', row.name];
          } else {
            row._props._hierarchy = ['Types', ...(this.getTypeHierarchy(row, this.schemaAll))];
          }
          row._props._isVisible = true;
        }
        
        rowData.sort((prev, next) => {
          if (prev.isEnum && !next.isEnum) {
            return 1;
          } else if (!prev.isEnum && next.isEnum) {
            return -1;
          }
          return 0;
        });
        
        return rowData;
      }),
      takeUntil(this.seDataService.showClassListGrid().pipe(filter(show => !show))),
    );
    
    this.tabId().pipe(
      switchMap(() => this.gridService.setColumns(columns)),
      tap(() => this.columnsSet = false),
      switchMap(() => data$),
      switchMap(data => {
        let selectedField;
        const type = data.find(type => {
          return type.fields.find(field => {
            if (field._props._isSelected) {
              selectedField = field;
            }
            
            return field._props._isSelected;
          });
        });
        
        this.seFieldFormsService.selectedChange(type?._props._uuid || '', selectedField?._props._uuid || '');
        return this.gridService.setRowData(data).pipe(map(() => data));
      }),
      filter(() => !this.columnsSet),
      switchMap(data => {
        this.columnsSet = data.length > 0;
        if (this.columnsSet) {
          this.selectInitial(data);
        }
        
        return this.gridService.resizeColumnsOnData(data).pipe(map(() => data));
      }),
      takeUntil(this.destroy$),
    ).subscribe();
    
    this.gridService.onDoubleClicked().pipe(
      takeUntil(this.destroy$),
    ).subscribe(event => {
      if (!event?.data) return;
      this.showEditItemModal(event.data);
    });
    
    this.gridService.onSelectionChanged().pipe(
      takeUntil(this.destroy$),
    ).subscribe((event: SelectionChangedEvent) => {
      const item = event.api.getSelectedRows()[0];
      if (item?._props && !item._props._isSelected) {
        this.seSelectionService.onSelectType(item?._props._uuid);
        this.appStore.dispatch(SetSelectedSchemaItem({itemName: item.name}));
      }
    });
    
    this.seFieldFormsService.hasChanges().pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.gridService.redrawRows()),
    ).subscribe();
  }
  
  private selectInitial(data: SchemaClassTypeModel[]): void {
    if (data.find(type => type._props._isSelected)) {
      return;
    }
    
    this.seSelectionService.selectedType().subscribe(typeUUid => {
      const item = data.find(type => type._props._uuid === typeUUid) || data[0];
      this.appStore.dispatch(SetSelectedSchemaItem({itemName: item.name}));
    });
  }
  
  private tabId(): Observable<string> {
    return this.activatedRoute.params.pipe(map(({id}) => id));
  }
  
  private getTypeHierarchy(row, schemaAll): string[] {
    const HIERARCHY: any[] = [];
    let current_parent, current_row = row;
    while (current_parent !== null) {
      HIERARCHY.unshift(current_row.name);
      current_parent = current_row.parent;
      if (current_parent) {
        current_row = schemaAll.find(schemaItem => schemaItem.name === current_row.parent);
      }
    }
    return HIERARCHY;
  }
  
  private showEditItemModal(typeItem: SchemaClassTypeModel) {
    if (this.editItemModalRef) {
      this.editItemModalRef.hide();
    }
    this.initEditItemForm(typeItem);
    this.editItemModalState = {...typeItem};
    this.editItemModalRef = this.modalService.show(this.modalTemplate, {
      class: 'modal-small createEdit-typeItem-modal',
      ignoreBackdropClick: true,
    });
  }
  
  private initEditItemForm(typeItem: SchemaClassTypeModel) {
    if (this.editTypeItemForm && typeof this.editTypeItemForm.reset === 'function') this.editTypeItemForm.reset();
    
    const FORM_CONFIG: {
      isUsed?: any[],
      name: any[],
      title: any[],
    } = {
      'name': [typeItem.name, [Validators.required], [this.forbiddenNames()]],
      'title': [typeItem.title || ''],
    };
    
    if (!typeItem.isEnum && !typeItem.isAbstract) {
      FORM_CONFIG.isUsed = [typeItem._props._isUsed];
    }
    
    this.editTypeItemForm = this.fb.group(FORM_CONFIG);
  }
  
  private forbiddenNames() {
    return uniqueName(
      this.appStore.pipe(
        select(getAllSchemaItems),
        take(1),
        map(items => items.filter(item => item.name !== this.editItemModalState?.name).map(item => item.name)),
      ),
    );
  }
  
  public isNameForbidden(): boolean {
    if (!this.editTypeItemForm) return false;
    const CONTROL = this.editTypeItemForm.get('name');
    return CONTROL && CONTROL.hasError('nameIsForbidden') && !CONTROL.pristine;
  }
  
  public onConfirmChanges(typeItem: SchemaClassTypeModel) {
    if (this.editTypeItemForm.invalid || this.editTypeItemForm.pristine) return;
    
    const FORM_VALUE: {
      isUsed?: boolean,
      name: string,
      title: string,
    } = this.editTypeItemForm.value;
    
    if (typeItem.name !== FORM_VALUE.name) {
      this.appStore.dispatch(typeItem.isEnum ? ChangeEnumName({
        enumItem: typeItem,
        newName: FORM_VALUE.name,
      }) : ChangeClassName({
        classItem: typeItem,
        newName: FORM_VALUE.name,
      }));
    }
    
    this.appStore.dispatch(ChangeSchemaItem({
      itemName: FORM_VALUE.name,
      item: {
        ...typeItem,
        name: FORM_VALUE.name,
        title: FORM_VALUE.title,
        _props: {
          ...typeItem._props,
          ...(!typeItem.isEnum ? {_isUsed: FORM_VALUE.isUsed} : {}),
        },
      },
    }));
    
    this.editItemModalRef.hide();
  }
  
  public getCbValue() {
    return this.editTypeItemForm.get('isUsed').value;
  }
  
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
