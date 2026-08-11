import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {Observable, Subject} from 'rxjs';
import {filter, map, switchMap, take, takeUntil, skip, first, tap} from 'rxjs/operators';
import { ConfirmModalService } from 'src/app/shared/components/modals/modal-on-close-alert/confirm-modal.service';
import { ClickOutsideService } from 'src/app/shared/directives/click-outside/click-outside.service';
import { uuid } from 'src/app/shared/utils/uuid';
import {AppState} from '../../../../../../core/store';
import {SchemaClassTypeModel} from '../../../../../../shared/models/schema.class.type.model';
import {uniqueName} from '../../../../../../shared/utils/validators';
import { SchemaEditorService } from '../../services/schema-editor.service';
import {AddNewSchemaItem, EditSchemaMergeState, UpdateSchemaAndRemoveType } from '../../store/schema-editor.actions';
import { addIdsToSchema } from '../../store/schema-editor.reducer';
import {
  getAllClasses,
  getAllSchemaItems,
  getSelectedSchemaItem,
  iSchemaItemsEdited,
} from '../../store/schema-editor.selectors';
import { ClassEnumListItem } from '../../models/class-enum-list-item.model';

@Component({
  selector: 'app-cl-control-panel',
  templateUrl: './cl-control-panel.component.html',
  styleUrls: ['./cl-control-panel.component.scss'],
})
export class ClControlPanelComponent implements OnInit, OnDestroy {
  @Input() classEnumList: ClassEnumListItem[];
  @Input() readonly = false;
  @Input() extendable = true;
  @Input() insideModal = false;
  public iSchemaItemsEdited: Observable<{
    newClassAdding: boolean;
    newEnumAdding: boolean;
  }>;

  public selectedItem$: Observable<SchemaClassTypeModel>;
  public requestMessage = '';
  public associatedItems: [string, string][] = [];
  public childTypes: string[] = [];
  public removingType: 'class' | 'enum' | 'multi';
  @ViewChild('modalTemplate', {static: true}) modalTemplate;
  @ViewChild('modalNewItemTemplate', {static: true}) modalNewItemTemplate;
  @ViewChild('modalRemoveItemsTemplate', {static: true}) modalRemoveItemsTemplate;
  public askToAddInitialState: {isEnum: boolean};
  public deleteModalRef: BsModalRef;
  public newItemModalRef: BsModalRef;
  public removeItemsModalRef: BsModalRef;
  public nameForm: UntypedFormGroup;
  public classNames$: Observable<string[]>;
  private destroy$ = new Subject<any>();
  private closeDropdown$ = new Subject();
  private selectedItemName: string;
  private schema: SchemaClassTypeModel[];
  private enumsSelectedToBeRemoved = new Set<string>();
  private classesSelectedToBeRemoved = new Set<string>();
  
  deletingTypes: { enums: string[], classes: string[] };
  builtInClassesList: string[];
  availableClasses: string[];

  private allShemaItems: string[];
  private builtInClasses = {
    'Bars': 'deltix.timebase.api.messages.BarMessage', 
    'Trades': 'deltix.timebase.api.messages.TradeMessage', 
    'BBO': 'deltix.timebase.api.messages.BestBidOfferMessage', 
    'Universal': 'deltix.timebase.api.messages.universal.PackageHeader', 
    'Securities': [
      'deltix.timebase.api.messages.securities.Equity',
      'deltix.timebase.api.messages.securities.Future',
      'deltix.timebase.api.messages.securities.ContinuousFuture',
      'deltix.timebase.api.messages.securities.Currency',
      'deltix.timebase.api.messages.securities.CustomInstrument',
      'deltix.timebase.api.messages.securities.Option',
      'deltix.timebase.api.messages.securities.Bond',
      'deltix.timebase.api.messages.securities.Index',
      'deltix.timebase.api.messages.securities.ETF',
      'deltix.timebase.api.messages.securities.ExchangeTradedSynthetic',
      'deltix.timebase.api.messages.securities.PriceFormat'
    ]
  };

  @ViewChild('builtInClassDropdown') builtInClassDropdown: ElementRef; 

  constructor(
    private appStore: Store<AppState>,
    private translate: TranslateService,
    private modalService: BsModalService,
    private fb: UntypedFormBuilder,
    private clickOutsideService: ClickOutsideService,
    private confirmModalService: ConfirmModalService,
    private schemaEditorService: SchemaEditorService,
  ) {}

  ngOnInit() {
    this.iSchemaItemsEdited = this.appStore.pipe(select(iSchemaItemsEdited));
    this.selectedItem$ = this.appStore.pipe(select(getSelectedSchemaItem));
    this.classNames$ = this.appStore.pipe(
      select(getAllClasses),
      map((types: SchemaClassTypeModel[]) => types.map((_type) => _type.name)),
    );

    this.builtInClassesList = Object.keys(this.builtInClasses);

    this.appStore.pipe(
      select(getAllSchemaItems),
      takeUntil(this.destroy$)
    ).subscribe(schemaItems => {
      this.schema = schemaItems;
      this.allShemaItems = schemaItems.map(item => item.name);
      this.availableClasses = Object.keys(this.builtInClasses).filter(key => {
        if (key !== 'Securities') {
          return !this.allShemaItems.includes(this.builtInClasses[key]);
        } else {
          return this.builtInClasses[key].some(className => !this.allShemaItems.includes(className));
        }
      })
    });
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
    this.schemaEditorService.addedClassNames.add(FORM_VALUE.name);
  }

  public openConfirmModal(builtInClass: string) {
    this.confirmModalService.confirm('schemaEditor.addBuiltInType.confirm')
      .pipe(
        first(), 
        takeUntil(this.destroy$),
        map((confirm) => (confirm ? builtInClass : null)),
        filter(Boolean)
      )
      .subscribe((builtInClass: string) => this.addBuiltInClass(builtInClass));
  }

  public toggleBuiltInClassList() {
    if (this.builtInClassDropdown.nativeElement.style.visibility === 'visible') {
      this.builtInClassDropdown.nativeElement.style.visibility = 'hidden';
      this.closeDropdown$.next();
    } else {
      this.builtInClassDropdown.nativeElement.style.visibility = 'visible';
      this.clickOutsideService.onOutsideClick(this.builtInClassDropdown.nativeElement)
        .pipe(skip(1), takeUntil(this.destroy$), takeUntil(this.closeDropdown$))
        .subscribe(() => {
          if (this.builtInClassDropdown.nativeElement.style.visibility === 'visible') {
            this.builtInClassDropdown.nativeElement.style.visibility = 'hidden';
            this.closeDropdown$.next();
            }
        });
    }
  }

  private addBuiltInClass(builtInClass: string) {
    this.appStore
      .pipe(
        select(getAllSchemaItems),
        first(),
        tap(schemaItems => this.allShemaItems = schemaItems.map(item => item.name)),
        switchMap(() => this.schemaEditorService.addBuiltInClass(builtInClass.toUpperCase())),
        first(),
        takeUntil(this.destroy$)
      )
      .subscribe((response: any) => {
        // response.all is the server-computed dependency closure for the built-in type and can legitimately
        // contain the same nested type more than once (e.g. reached via several parent messages in UNIVERSAL).
        // Only drop items that already exist in the current schema; genuine repeats *within* this response are
        // disambiguated by addIdsToSchema (unique id + duplicated:true) instead of being silently discarded, so
        // they surface through the same duplicates warning/Remove-Keep flow as everywhere else in the editor.
        const newItems = response.all
          .filter(newItem => !this.allShemaItems.includes(newItem.name))
          .map(newItem =>
            !newItem.isEnum && response.types.find(type => type.name === newItem.name)
              ? { ...newItem, isConcrete: true }
              : newItem,
          );

        const itemsWithIds = addIdsToSchema(newItems);
        const classes = itemsWithIds.filter(item => !item.isEnum);
        const enums = itemsWithIds.filter(item => item.isEnum);

        this.appStore.dispatch(
          EditSchemaMergeState({
            classes: classes.map(classItem => this.addTypeRenderProps(classItem)),
            enums: enums.map(enumItem => this.addTypeRenderProps(enumItem, true)),
          }),
        );
        const className = this.builtInClasses[builtInClass];

        if (typeof className === 'string') {
          this.schemaEditorService.addedClassNames.add(className);
        } else {
          for (let name of className) {
            this.schemaEditorService.addedClassNames.add(name);
          }
        }
      })
    }

  private addTypeRenderProps(type: SchemaClassTypeModel, isEnum = false) {
    const fieldsWithProps = type.fields.map(typeField => ({
      ...typeField,
      _props: {
        typeName: type.id,
        _uuid: `${type.id}:${typeField.id}`,
        _isSelected: false
      }
    }))
    return {
      ...type,
      fields: fieldsWithProps,
      _props: {
        _isUsed: !isEnum && type.isConcrete,
        _isEdited: true,
        _isSelected: false,
        _isNew: true,
        _typeName: type.id,
        _uuid: uuid()
      }
    }
  }

  onAskToRemoveItems() {
    this.removeItemsModalRef = this.modalService.show(this.modalRemoveItemsTemplate, {
      class: 'modal-small',
      ignoreBackdropClick: true,
    });
  }

  openRemovingConfirmationModal() {
    if (this.removeItemsModalRef) this.removeItemsModalRef.hide();

    this.deletingTypes = {
      enums: Array.from(this.enumsSelectedToBeRemoved),
      classes: Array.from(this.classesSelectedToBeRemoved)
    };

    const allAssociatedItems = new Set<string>();
    const allChildTypes = new Set<string>();
    
    this.classesSelectedToBeRemoved.forEach(className => {
      const childTypes = this.schema.find(schemaItem => schemaItem.name === className)._props._children;
      childTypes?.forEach(childType => allChildTypes.add(childType));

      const associatedItems = this.getAssociatedSchemaItems(className, false, this.schema);
      associatedItems.map(item => JSON.stringify(item)).forEach(item => allAssociatedItems.add(item));
    });

    this.enumsSelectedToBeRemoved.forEach(enumName => {
      const associatedItems = this.getAssociatedSchemaItems(enumName, true, this.schema);
      associatedItems.map(item => JSON.stringify(item)).forEach(item => allAssociatedItems.add(item));
    });

    this.childTypes = Array.from(allChildTypes);
    this.associatedItems = Array.from(allAssociatedItems).map(item => JSON.parse(item));
    this.removingType = 'multi';

    this.deleteModalRef = this.modalService.show(this.modalTemplate, {
      class: 'modal-small createEdit-typeItem-modal',
      ignoreBackdropClick: true,
    });
    this.subscribeOnModalHide();
  }

  onRemoveItemsModalCheckboxChange(event: Event, classId: string, isEnum: boolean) {
    const deletingItems = isEnum ? this.enumsSelectedToBeRemoved : this.classesSelectedToBeRemoved;
    (event.target as HTMLInputElement).checked ? deletingItems.add(classId) : 
      deletingItems.delete(classId);
  }

  public onAskDeleteSelected() {
    this.associatedItems.length = 0;
    this.selectedItem$
      .pipe(
        filter((selectedItem) => !!selectedItem),
        take(1),
        takeUntil(this.destroy$),
        switchMap((selectedItem) => {

          let requestMessageType = '';
          if (selectedItem.isEnum) {
            requestMessageType = 'removeENUMRequest';
            this.associatedItems = this.getAssociatedSchemaItems(selectedItem.name, true, this.schema);

            if (this.associatedItems.length) {
              this.removingType = 'enum';
              requestMessageType = 'removeEnumWithFieldTypeRequest';
            }
          }
          
          if (!selectedItem.isEnum && selectedItem._props) {
            if (selectedItem._props._children && selectedItem._props._children.length) {
              requestMessageType = 'removeClassWithChildsRequest';
            } else {
              requestMessageType = 'removeClassRequest';
            }

            this.associatedItems = this.getAssociatedSchemaItems(selectedItem.name, false, this.schema);
            if (this.associatedItems.length) {
              this.removingType = 'class';
              requestMessageType = 'removeClassWithFieldTypeRequest';
            }
          }

          this.selectedItemName = selectedItem.name;
          return this.translate.get(`text.${requestMessageType}`, { name: selectedItem.name });
        }),
      )
      .subscribe((message) => {
        this.requestMessage = message;

        this.deleteModalRef = this.modalService.show(this.modalTemplate, {
          class: 'modal-small',
          ignoreBackdropClick: true,
        });
        this.subscribeOnModalHide();
      });
  }

  private subscribeOnModalHide() {
    this.deleteModalRef.onHide.pipe(take(1), takeUntil(this.destroy$)).subscribe(() => {
      this.clearDeletingItemsList();
    });
  }

  public onDeleteSelected() {
    if (this.enumsSelectedToBeRemoved.size || this.classesSelectedToBeRemoved.size) {
      const deletingItems = this.classEnumList.filter(item => {
        return this.enumsSelectedToBeRemoved.has(item.id) || this.classesSelectedToBeRemoved.has(item.id);
      });
      deletingItems.forEach(item => this.schemaEditorService.removedClassNames.add(item.name));
      this.appStore.dispatch(UpdateSchemaAndRemoveType({ deletingItems, insideModal: this.insideModal }));
      this.clearDeletingItemsList();
    } else {
      this.schemaEditorService.removedClassNames.add(this.selectedItemName);
      this.appStore.dispatch(UpdateSchemaAndRemoveType({ insideModal: this.insideModal }));
    }
    this.associatedItems.length = 0;
    this.deleteModalRef.hide();
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

  private getAssociatedSchemaItems(itemName: string, isEnum: boolean, schema: SchemaClassTypeModel[]) {
    const associatedItems: [string, string][] = [];
    if (isEnum) {
      schema.forEach(schemaItem => {
        schemaItem.fields.forEach(field => {
          if (field.type.name === itemName || field.type.elementType?.name === itemName) {
            associatedItems.push([schemaItem.name, field.name]);
          }
        });
      });
      return associatedItems;
    } else {
      schema.forEach(schemaItem => {
        schemaItem.fields.forEach(field => {
          if (field.type.types?.includes(itemName) || field.type.elementType?.types?.includes(itemName)) {
            this.associatedItems.push([schemaItem.name, field.name]);
          }
        })
      });
      return associatedItems;
    }
  }

  private clearDeletingItemsList() {
    this.classesSelectedToBeRemoved.clear();
    this.enumsSelectedToBeRemoved.clear();
    this.associatedItems.length = 0;
    this.childTypes.length = 0;
  }

  hideRemoveItemsModal() {
    this.removeItemsModalRef.hide();
    this.clearDeletingItemsList();
  }
}
