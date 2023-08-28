import {Component, EventEmitter, HostListener, OnDestroy, OnInit, Output} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {GridOptions, SelectionChangedEvent} from 'ag-grid-community';
import {Observable, of, Subject} from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  takeUntil,
  withLatestFrom,
  take,
} from 'rxjs/operators';
import { GridEventsService } from 'src/app/shared/services/grid-events.service';
import {AppState} from '../../../../../../core/store';
import {GridContextMenuService} from '../../../../../../shared/grid-components/grid-context-menu.service';
import {
  SchemaClassFieldModel,
  SchemaClassTypeModel,
} from '../../../../../../shared/models/schema.class.type.model';
import {GridService} from '../../../../../../shared/services/grid.service';
import {columnsVisibleColumn} from '../../../../../../shared/utils/grid/config.defaults';
import {SeFieldFormsService} from '../../services/se-field-forms.service';
import {SeSelectionService} from '../../services/se-selection.service';
import {
  SetSelectedFieldForSchemaItem,
  SetSelectedSchemaItem,
} from '../../store/schema-editor.actions';
import {
  getSelectedSchemaItem,
  getSelectedSchemaItemAllFields,
} from '../../store/schema-editor.selectors';

@Component({
  selector: 'app-fields-list',
  templateUrl: './fields-list.component.html',
  styleUrls: ['./fields-list.component.scss'],
  providers: [GridService, GridContextMenuService],
})
export class FieldsListComponent implements OnInit, OnDestroy {
  public gridOptions$: Observable<GridOptions>;
  private destroy$ = new Subject();
  private type: SchemaClassTypeModel;
  private selectedFieldName: string;
  @Output() addNewFieldEvent = new EventEmitter<[HTMLElement, boolean]>();
  @HostListener('keydown.insert', ['$event']) onInsertKeyDown(event: KeyboardEvent) {
    this.addNewFieldEvent.emit([event.target as HTMLElement, this.gridService.gridApi.getSelectedRows()[0].static]);
  }

  constructor(
    private appStore: Store<AppState>,
    private translate: TranslateService,
    private seFieldFormsService: SeFieldFormsService,
    private seSelectionService: SeSelectionService,
    private gridService: GridService,
    private activatedRoute: ActivatedRoute,
    private gridEventsService: GridEventsService,
  ) {}

  ngOnInit() {
    this.gridOptions$ = this.activatedRoute.params.pipe(
      map(({id}) => {
        return this.gridService.options(`${id}fieldList`, {
          deltaRowDataMode: true,
          rowClassRules: {
            isEdited: ({data}) =>
              this.seFieldFormsService.fieldHasChanges(data) || data._props._isNew,
            hasError: ({data}) => this.seFieldFormsService.showErrorOnField(this.type, data),
            'ag-row-editing': ({data}) => data._props?._isSelected,
          },
          getRowNodeId: ({name}) => name,
        });
      }),
    );

    this.gridService
      .onSelectionChanged()
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: SelectionChangedEvent) => {
        const item = event.api.getSelectedRows()[0];
        this.gridEventsService.selectedField.next(item);
        if (item && !item._props?._parentName) {
          this.selectedFieldName = item.name;
          setTimeout(() => {
            if (item.name === this.selectedFieldName) {
              this.appStore.dispatch(SetSelectedFieldForSchemaItem({fieldUuid: item._props._uuid}));
            }
          }, 300);
        }
      });

    this.gridService
      .onDoubleClicked()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({data}) => {
        if (data._props && data._props._parentName) {
          this.appStore.dispatch(SetSelectedSchemaItem({itemName: data._props._parentName}));
        }
      });

    this.appStore
      .pipe(
        select(getSelectedSchemaItem),
        distinctUntilChanged((p, c) => p?._props?._uuid === c?._props?._uuid),
        withLatestFrom(this.translate.get('gridTitle.fieldsList')),
        takeUntil(this.destroy$),
        switchMap(([selectedItem, messages]) => {
          if (!selectedItem) return of(null);
          this.type = selectedItem;
          let props;
          if (selectedItem.isEnum) {
            props = [
              columnsVisibleColumn(),
              {
                headerName: messages.values,
                field: 'name',
                filter: false,
                sortable: false,
              },
            ];
          } else {
            props = [
              columnsVisibleColumn(true, true),
              {
                headerName: messages.name,
                field: 'name',
                floatingFilterComponent: 'GridTextFilterComponent',
                sortable: false,
                cellRenderer: ({data, value}) => {
                  if (data._props?._parentField) {
                    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="12" width="12" style="color: white; transform: rotate(90deg);"
        fill="currentcolor" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M11 9l1.42 1.42L8.83 14H18V4h2v12H8.83l3.59 3.58L11 21l-6-6 6-6z"/></svg><span>${value}</span>`;
                  }
                  return value;
                },
              },
              {
                headerName: messages.static.title,
                field: 'static',
                floatingFilterComponent: 'GridDropdownFilterComponent',
                floatingFilterComponentParams: {
                  list: [
                    {id: 'true', name: messages.static.static},
                    {id: 'false', name: messages.static.nonstatic},
                  ],
                },
                sortable: false,
                valueFormatter: ({value}) =>
                  value ? messages.static.static : messages.static.nonstatic,
              },
              {
                headerName: messages.type,
                field: 'type',
                filter: false,
                sortable: false,
                children: [
                  {
                    headerName: messages.encoding,
                    field: 'type.encoding',
                    filter: false,
                    sortable: false,
                  },
                  {
                    headerName: messages.name,
                    field: 'type.name',
                    filter: false,
                    sortable: false,
                  },
                  {
                    headerName: messages.nullable,
                    field: 'type.nullable',
                    filter: false,
                    sortable: false,
                  },
                ],
              },
              {
                headerName: messages.title,
                field: 'title',
                floatingFilterComponent: 'GridTextFilterComponent',
                sortable: false,
              },
              {
                headerName: messages.description,
                field: 'relativeTo',
                filter: false,
                sortable: false,
              },
              {
                headerName: messages.description,
                field: 'description',
                filter: false,
                sortable: false,
              },
            ];
          }

          return this.gridService.setColumns(props);
        }),
      )
      .subscribe();

    this.appStore
      .pipe(
        select(getSelectedSchemaItemAllFields),
        distinctUntilChanged(),
        filter((fields) => !!fields),
        takeUntil(this.destroy$),
        switchMap((fields) => this.gridService.setRowData(fields).pipe(map(() => fields))),
      )
      .subscribe((fields) => {
        const selected = fields.find((f) => f._props._isSelected);
        if (selected) {
          this.seSelectionService.onSelectField(selected._props._typeName, selected?._props._uuid);
        }
        this.selectInitial(fields);
      });

    this.seFieldFormsService
      .hasChanges()
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.gridService.redrawRows()),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private selectInitial(fields: SchemaClassFieldModel[]) {
    if (!fields.length || fields.find((f) => f._props._isSelected)) {
      return;
    }

    const selectedType = fields.find((f) => f._props._typeName)?._props._typeName;
    if (!selectedType) {
      return;
    }
    this.seSelectionService
      .selectedField(selectedType)
      .pipe(take(1))
      .subscribe((fieldUUid) => {
        let field =
          fieldUUid && fields.find((f) => f._props._uuid === fieldUUid && !f._props?._parentName);
        if (!field) {
          field = fields.find((f) => !f._props?._parentName);
        }

        if (field) {
          this.appStore.dispatch(SetSelectedFieldForSchemaItem({fieldUuid: field._props._uuid}));
          this.gridService.gridApi.forEachNode((node) => {
            if (field.name === node.data.name) {
              node.setSelected(true);
              this.gridService.gridApi.ensureIndexVisible(node.rowIndex, 'middle');
            }
          })
        }
    })
  }
}
