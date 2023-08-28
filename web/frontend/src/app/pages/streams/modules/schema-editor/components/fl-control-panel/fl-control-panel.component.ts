import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {filter, map, switchMap, take, takeUntil} from 'rxjs/operators';
import { GridEventsService } from 'src/app/shared/services/grid-events.service';
import {AppState} from '../../../../../../core/store';
import {
  SchemaClassFieldModel,
  SchemaClassTypeModel,
} from '../../../../../../shared/models/schema.class.type.model';
import {uniqueName} from '../../../../../../shared/utils/validators';
import { SchemaEditorService } from '../../services/add-class.service';
import {
  AddNewFieldForSelectedSchemaItem,
  RemoveSelectedField,
} from '../../store/schema-editor.actions';
import {
  getSelectedSchemaItem,
  getSelectedSchemaItemAllFields,
  ifNewFieldIsAdding,
} from '../../store/schema-editor.selectors';

export const FIELD_NAME_PATTER_REGEXP = /^[a-zA-Z][a-zA-Z\d\$_]*$/;

@Component({
  selector: 'app-fl-control-panel',
  templateUrl: './fl-control-panel.component.html',
  styleUrls: ['./fl-control-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlControlPanelComponent implements OnInit, OnDestroy {
  public newFieldIsAdding: Observable<boolean>;

  @ViewChild('modalTemplate', {static: true}) modalTemplate;
  @ViewChild('modalNewItemTemplate', {static: true}) modalNewItemTemplate;
  public askToAddInitialState: {isStatic: boolean};
  public deleteModalRef: BsModalRef;
  public newItemModalRef: BsModalRef;
  public nameForm: UntypedFormGroup;
  public requestMessage = '';
  public ifFieldSelected$: Observable<boolean>;
  public selectedSchemaItem$: Observable<SchemaClassTypeModel>;
  public deleteBtnDisabled$ = new BehaviorSubject<boolean>(false);;
  private destroy$ = new Subject<any>();
  private selectedFieldName: string;

  constructor(
    private appStore: Store<AppState>,
    private modalService: BsModalService,
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private gridEventsService: GridEventsService,
    private schemaEditorService: SchemaEditorService
  ) {}

  ngOnInit() {
    this.selectedSchemaItem$ = this.appStore.pipe(select(getSelectedSchemaItem));
    this.ifFieldSelected$ = this.selectedSchemaItem$.pipe(
      map(
        (selectedItem) =>
          !!(
            selectedItem &&
            selectedItem._props &&
            typeof selectedItem._props._selectedFieldUuid === 'string'
          ),
      ),
    );

    this.gridEventsService.selectedField
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedField => {
        this.deleteBtnDisabled$.next(!!selectedField?._props._parentField);
    })
  }

  public onAddNewField(isStatic?: boolean) {
    if (!this.nameForm || this.nameForm.invalid) {
      return;
    }
    if (this.newItemModalRef) this.newItemModalRef.hide();
    this.appStore.dispatch(
      AddNewFieldForSelectedSchemaItem({
        isStatic,
        ...this.nameForm.value,
      }),
    );
    this.newFieldIsAdding = this.appStore.pipe(select(ifNewFieldIsAdding));
    this.schemaEditorService.editedFieldNames.add(this.nameForm.value.name);
  }

  public isNameForbidden(): boolean {
    if (!this.nameForm) return false;
    const CONTROL = this.nameForm.get('name');
    return CONTROL && CONTROL.hasError('nameIsForbidden') && !CONTROL.pristine;
  }

  public onDeleteSelectedField() {
    if (this.deleteModalRef) this.deleteModalRef.hide();
    this.appStore.dispatch(RemoveSelectedField());
    this.schemaEditorService.editedFieldNames.add(this.selectedFieldName);
  }

  public onAskDeleteSelected() {
    this.selectedField()
      .pipe(
        filter(Boolean),
        switchMap((field: SchemaClassFieldModel) => {
          this.selectedFieldName = field.name;
          return this.translate.get(`text.removeFieldRequest`, {name: field.name});
        }),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe((message) => {
        this.requestMessage = message;
        this.deleteModalRef = this.modalService.show(this.modalTemplate, {
          class: 'modal-small createEdit-typeItem-modal',
        });
      });
  }

  public onAskToAdd(isStatic?: boolean) {
    this.selectedSchemaItem$.pipe(take(1)).subscribe((selectedSchemaItem) => {
      this.nameForm = this.fb.group({
        name: [
          null,
          selectedSchemaItem?.isEnum
            ? [Validators.required]
            : [Validators.required, Validators.pattern(FIELD_NAME_PATTER_REGEXP)],
          this.forbiddenNames(),
        ],
      });
      this.nameForm.reset();

      this.askToAddInitialState = {isStatic};
      this.modalService.onShow.pipe(take(1), takeUntil(this.destroy$)).subscribe(() => {
        setTimeout(() => {
          const input = window.document.getElementById('nameInput');
          if (input) {
            input.focus();
          }
        }, 300);
      });
      this.newItemModalRef = this.modalService.show(this.modalNewItemTemplate, {
        class: 'modal-small createEdit-field-modal',
        ignoreBackdropClick: true,
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private forbiddenNames() {
    return uniqueName(
      this.appStore.pipe(
        select(getSelectedSchemaItemAllFields),
        take(1),
        map((fields) => fields.map((f) => f.name)),
      ),
    );
  }

  private selectedField(): Observable<SchemaClassFieldModel> {
    return this.appStore.pipe(
      select(getSelectedSchemaItemAllFields),
      map((fields) => fields.find((f) => f._props._isSelected)),
    );
  }
}
