import { Component, OnInit, ViewChildren, QueryList, ElementRef, OnDestroy, Input } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ImportFromTextFileService } from '../../../services/import-from-text-file.service';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

@Component({
  selector: 'app-types-setting',
  templateUrl: './types-setting.component.html',
  styleUrls: ['./types-setting.component.scss']
})
export class TypesSettingComponent implements OnInit, OnDestroy {

  unMatchedKeywordsOptions = { 
    ABORT: "Abort if Unmatched Keyword found",
    SKIP: "Skip Unmatched Keywords"
  }

  formGroup: FormGroup;
  keywordInputsVisible: boolean = true;
  selectedTypes: string[] = [];
  typeToKeywordMapping = {};
  errorMessages = {};
  errorMessageList: string[];

  private destroy$ = new Subject();

  @Input() typeToKeywordMappingChanged: boolean;

  @ViewChildren('symbol') textInputElements: QueryList<ElementRef<HTMLElement>>;

  constructor(private fb: FormBuilder, private importFromTextFileService: ImportFromTextFileService) {}

  ngOnInit(): void {
    this.getErrorMessages();
    this.importFromTextFileService.settingsUpdated
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.getErrorMessages());

    this.typeToKeywordMapping = {
      ...this.importFromTextFileService.defaultSettings.typeToKeywordMapping,
      ...this.importFromTextFileService.settings.typeToKeywordMapping
    };

    Object.keys(this.importFromTextFileService.defaultSettings.typeToKeywordMapping).forEach((key: string) => {
      this.typeToKeywordMapping[key] = this.importFromTextFileService.settings.typeToKeywordMapping[key] ??
        this.importFromTextFileService.defaultSettings.typeToKeywordMapping[key];
    });

    this.importFromTextFileService.updateKeywordColumnMappedProp();

    this.selectedTypes = Object.keys(this.importFromTextFileService.settings.typeToKeywordMapping);

    let mappingFormControls = {};
    Object.keys(this.typeToKeywordMapping).forEach((key: string) => {
      mappingFormControls[key.replaceAll('.', '-')] = {
        value: this.typeToKeywordMapping[key],
        disabled: !this.selectedTypes.includes(key)
      }
    });

    this.formGroup = this.fb.group({
      strategy: { 
        value: this.importFromTextFileService.settings.strategy ?? 'SKIP', 
        disabled: !this.importFromTextFileService.keywordColumnMapped 
      },
      ...mappingFormControls,
    });

    this.importFromTextFileService.settingsUpdated
      .pipe(
        filter(updateFormData => updateFormData),
        takeUntil(this.destroy$))
      .subscribe(() => {
        let mappingFormControls = {};
        Object.keys(this.importFromTextFileService.defaultTypeToKeywordMapping).forEach((key: string) => {
          mappingFormControls[key.replaceAll('.', '-')] = this.importFromTextFileService.defaultTypeToKeywordMapping[key];
        });

        this.formGroup.patchValue({
          strategy: this.importFromTextFileService.settings.strategy,
          ...mappingFormControls },
          { emitEvent: false } );

        this.getErrorMessages();
        this.selectedTypes = Object.keys(this.importFromTextFileService.settings.typeToKeywordMapping);

        Object.keys(this.importFromTextFileService.defaultSettings.typeToKeywordMapping).forEach(key => {
          if (!this.selectedTypes.includes(key)) {
            this.formGroup.get(key.replaceAll('.', '-')).disable();
          } else {
            this.formGroup.get(key.replaceAll('.', '-')).enable();
          }
        })

        this.importFromTextFileService.updateKeywordColumnMappedProp();
        
        if (this.importFromTextFileService.keywordColumnMapped) {
          this.formGroup.get('strategy').enable();
        } else {
          this.formGroup.get('strategy').disable();
        }
      })

    this.formGroup.valueChanges
      .pipe(takeUntil(this.destroy$)).subscribe(formData => {
        if (formData.strategy) {
          this.importFromTextFileService.updateSettings('strategy', formData.strategy, true);
          delete formData.strategy;
        }
        const newValues = {};
        Object.keys(formData).forEach(key => {
          newValues[key.replaceAll('-', '.')] = formData[key];
        })
        
        const newTypeMapping = this.importFromTextFileService.keywordColumnMapped ? {
          ...this.importFromTextFileService.settings.typeToKeywordMapping,
          ...newValues
        } : newValues;

        this.importFromTextFileService.updateSettings('typeToKeywordMapping', newTypeMapping, true);
        
        const typeToKeyWordMappingInvalid = Object.values(newValues).some(keyword => keyword === '');
        const errorMessageText = typeToKeyWordMappingInvalid ? 'Invalid Type To Keyword Mapping' : '';
        this.importFromTextFileService.updateSettingsValidation();
        this.setErrorMessages( { typeToKeyWord: errorMessageText } );
      })
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  toggleKeywordsVisibility(event) {
    let newTypeMapping = {...this.importFromTextFileService.settings.typeToKeywordMapping};
    if (event.target.checked) {
      if (this.importFromTextFileService.keywordColumnMapped) {
        this.selectedTypes.push(event.target.value);
        newTypeMapping[event.target.value] = this.typeToKeywordMapping[event.target.value];
      } else {
        this.formGroup.disable();
        this.selectedTypes = [event.target.value];
        newTypeMapping = { [event.target.value]: this.typeToKeywordMapping[event.target.value] };
      }
      this.formGroup.get((event.target.value).replaceAll('.', '-')).enable();
    } else {
      if (this.importFromTextFileService.keywordColumnMapped) {
        this.selectedTypes = this.selectedTypes.filter(value => value !== event.target.value);
        delete newTypeMapping[event.target.value];
        this.formGroup.get((event.target.value).replaceAll('.', '-')).disable();
      } else {
        this.selectedTypes = [];
        newTypeMapping = {} ;
      }

      if (this.selectedTypes.length > 0) {
        const typeInMapping = this.importFromTextFileService.currentMappings.filter(item => item.field.messageType === event.target.value);
        typeInMapping.forEach(item => item.column = null);
      }
    }
    this.importFromTextFileService.updateSettings('defaultMessageType', this.selectedTypes[0], true);
    this.importFromTextFileService.updateSettings('typeToKeywordMapping', newTypeMapping, true);

    if (this.selectedTypes.length === 0) {
      setTimeout(() => event.target.click(), 0);
    }
  }

  keywordChanged(key: string) {
    const currentValue = this.importFromTextFileService.settings.typeToKeywordMapping[key];
    return currentValue && currentValue !== this.importFromTextFileService.defaultSettings.typeToKeywordMapping[key];
  }

  keywordInvalid(key: string) {
    return this.importFromTextFileService.settings.typeToKeywordMapping[key] === '';
  }

  setErrorMessages(mes: object) {
    this.importFromTextFileService.errorMessages = Object.assign(this.importFromTextFileService.errorMessages, mes);
    const allMessages = Object.values(this.errorMessages) as string[];
    this.errorMessageList = allMessages.filter(mes => mes !== '');
  }

  getErrorMessages() {
    this.errorMessages = this.importFromTextFileService.errorMessages;
    const allMessages = Object.values(this.errorMessages) as string[];
    this.errorMessageList = allMessages.filter(mes => mes !== '');
  }

  settingEdited(key: string) {
    const changedValue = this.importFromTextFileService.editedSettings?.[key];
    return changedValue && changedValue !== this.importFromTextFileService.defaultSettings[key];
  }
}