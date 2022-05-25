import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {Observable, Subject} from 'rxjs';
import {filter, map, switchMap, take, takeUntil} from 'rxjs/operators';
import {AppState} from '../../../../../../core/store';
import {SchemaClassTypeModel} from '../../../../../../shared/models/schema.class.type.model';
import {uniqueName} from '../../../../../../shared/utils/validators';
import {AddNewSchemaItem, RemoveSelectedSchemaItem} from '../../store/schema-editor.actions';
import {
  getAllClasses,
  getAllSchemaItems,
  getSelectedSchemaItem,
  iSchemaItemsEdited,
} from '../../store/schema-editor.selectors';

@Component({
  selector: 'app-cl-control-panel',
  templateUrl: './cl-control-panel.component.html',
  styleUrls: ['./cl-control-panel.component.scss'],
})
export class ClControlPanelComponent implements OnInit, OnDestroy {
  public iSchemaItemsEdited: Observable<{
    newClassAdding: boolean;
    newEnumAdding: boolean;
  }>;

  public selectedItem$: Observable<SchemaClassTypeModel>;
  public requestMessage = '';
  @ViewChild('modalTemplate', {static: true}) modalTemplate;
  @ViewChild('modalNewItemTemplate', {static: true}) modalNewItemTemplate;
  public askToAddInitialState: {isEnum: boolean};
  public deleteModalRef: BsModalRef;
  public newItemModalRef: BsModalRef;
  public nameForm: FormGroup;
  public classNames$: Observable<string[]>;
  private destroy$ = new Subject<any>();

  constructor(
    private appStore: Store<AppState>,
    private translate: TranslateService,
    private modalService: BsModalService,
    private fb: FormBuilder,
  ) {}

  ngOnInit() {
    this.iSchemaItemsEdited = this.appStore.pipe(select(iSchemaItemsEdited));
    this.selectedItem$ = this.appStore.pipe(select(getSelectedSchemaItem));
    this.classNames$ = this.appStore.pipe(
      select(getAllClasses),
      map((types: SchemaClassTypeModel[]) => types.map((_type) => _type.name)),
    );
  }

  initForm(isEnum?: boolean) {
    const FORM_CONFIG: {
      isUsed?: any[];
      parentName?: any[];
      name: any[];
      title: any[];
    } = {
      name: ['', [Validators.required], [this.forbiddenNames()]],
      title: [''],
    };

    if (!isEnum) {
      FORM_CONFIG.isUsed = [true, []];
      FORM_CONFIG.parentName = [];
    }

    this.nameForm = this.fb.group(FORM_CONFIG);

    if (!isEnum && this.nameForm?.get('isUsed')) {
      this.nameForm.get('isUsed').setValue(true);
    }
  }

  public isNameForbidden(): boolean {
    const CONTROL = this.nameForm.get('name');
    return CONTROL.hasError('nameIsForbidden') && !CONTROL.pristine;
  }

  public getCbValue() {
    return this.nameForm.get('isUsed').value;
  }

  public onAddClass(isEnum?: boolean) {
    if (this.nameForm.invalid) return;
    if (this.newItemModalRef) this.newItemModalRef.hide();
    const FORM_VALUE = this.nameForm.value;
    this.appStore.dispatch(
      AddNewSchemaItem({
        isEnum: !!isEnum,
        ...FORM_VALUE,
      }),
    );
  }

  public onAskDeleteSelected() {
    this.selectedItem$
      .pipe(
        filter((selectedItem) => !!selectedItem),
        take(1),
        takeUntil(this.destroy$),
        switchMap((selectedItem) => {
          let requestMessageType = '';
          if (selectedItem.isEnum) requestMessageType = 'removeENUMRequest';
          if (!selectedItem.isEnum && selectedItem._props) {
            if (selectedItem._props._children && selectedItem._props._children.length) {
              requestMessageType = 'removeClassWithChildsRequest';
            } else {
              requestMessageType = 'removeClassRequest';
            }
          }
          return this.translate.get(`text.${requestMessageType}`, {name: selectedItem.name});
        }),
      )
      .subscribe((message) => {
        this.requestMessage = message;

        this.deleteModalRef = this.modalService.show(this.modalTemplate, {
          class: 'modal-small',
        });
      });
  }

  public onDeleteSelected() {
    this.deleteModalRef.hide();
    this.appStore.dispatch(RemoveSelectedSchemaItem());
  }

  public onAskToAdd(isEnum?: boolean) {
    this.initForm(!!isEnum);

    this.selectedItem$.pipe(take(1), takeUntil(this.destroy$)).subscribe((selectedItem) => {
      // tslint:disable-next-line:triple-equals
      if (selectedItem && selectedItem.name && Boolean(isEnum) == selectedItem.isEnum) {
        this.nameForm.reset({
          // name: selectedItem.name,
          isUsed: true,
          parentName: selectedItem.name,
        });
      } else {
        this.nameForm.reset({
          isUsed: true,
        });
      }

      this.askToAddInitialState = {isEnum};
      this.modalService.onShow.pipe(take(1), takeUntil(this.destroy$)).subscribe(() => {
        setTimeout(() => {
          const input = window.document.getElementById('nameInput');
          if (input) {
            input.focus();
          }
        }, 300);
      });
      this.newItemModalRef = this.modalService.show(this.modalNewItemTemplate, {
        class: 'modal-small createEdit-typeItem-modal',
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
        select(getAllSchemaItems),
        take(1),
        map((items) => items.map((item) => item.name)),
      ),
    );
  }
}
