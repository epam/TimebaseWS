import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {Observable, Subject, of} from 'rxjs';
import {filter, map, switchMap, take, takeUntil, skip, first, tap} from 'rxjs/operators';
import { ConfirmModalService } from 'src/app/shared/components/modals/modal-on-close-alert/confirm-modal.service';
import { ClickOutsideService } from 'src/app/shared/directives/click-outside/click-outside.service';
import { SchemaService } from 'src/app/shared/services/schema.service';
import { uuid } from 'src/app/shared/utils/uuid';
import {AppState} from '../../../../../../core/store';
import {SchemaClassTypeModel} from '../../../../../../shared/models/schema.class.type.model';
import {uniqueName} from '../../../../../../shared/utils/validators';
import { SchemaEditorService } from '../../services/add-class.service';
import { SeDataService } from '../../services/se-data.service';
import {AddNewSchemaItem, EditSchemaMergeState, RemoveSelectedSchemaItem } from '../../store/schema-editor.actions';
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
  public associatedItems: [string, string][] = [];
  public removingType: 'class' | 'enum';
  @ViewChild('modalTemplate', {static: true}) modalTemplate;
  @ViewChild('modalNewItemTemplate', {static: true}) modalNewItemTemplate;
  public askToAddInitialState: {isEnum: boolean};
  public deleteModalRef: BsModalRef;
  public newItemModalRef: BsModalRef;
  public nameForm: UntypedFormGroup;
  public classNames$: Observable<string[]>;
  private destroy$ = new Subject<any>();
  private closeDropdown$ = new Subject();
  private selectedItemName: string;

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
    private seDataService: SeDataService,
    private confirmModalService: ConfirmModalService,
    private schemaEditorService: SchemaEditorService,
    private schemaService: SchemaService
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
        const classes = [];
        const enums = [];
        for (let newItem of response.all) {
          if (!this.allShemaItems.includes(newItem.name)) {
            if (!newItem.isEnum) {
              if (response.types.find(type => type.name === newItem.name)) {
                classes.push({ ...newItem, isConcrete: true });
              } else {
                classes.push(newItem);
              }
            } else {
              enums.push(newItem);
            }
          }
        }
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
        typeName: type.name,
        _uuid: `${type.name}:${typeField.name}`,
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
        _typeName: type.name,
        _uuid: uuid()
      }
    }
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
            this.schemaService.schema.all.forEach(type => {
              type.fields.forEach(field => {
                if (field.type.name === selectedItem.name || field.type.elementType?.name === selectedItem.name) {
                  this.associatedItems.push([type.name, field.name]);
                }
              })
            })
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
            this.schemaService.schema.all.forEach(type => {
              type.fields.forEach(field => {
                if (field.type.elementType?.types.includes(selectedItem.name)) {
                  this.associatedItems.push([type.name, field.name]);
                }
              })
            })
            if (this.associatedItems.length) {
              this.removingType = 'class';
              requestMessageType = 'removeClassWithFieldTypeRequest';
            }
          }

          this.selectedItemName = selectedItem.name;
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
    this.schemaEditorService.removedClassNames.add(this.selectedItemName);
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
