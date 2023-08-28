import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ClickOutsideService } from 'src/app/shared/directives/click-outside/click-outside.service';
import { ImportFromTextFileService } from '../../../services/import-from-text-file.service';
import { Subject } from 'rxjs';
import { takeUntil, skip, filter } from 'rxjs/operators';

const charsetTypes = ['UTF-8', 'UTF-16BE', 'UTF-16LE', 'ASCII'];

@Component({
  selector: 'app-general-parameters',
  templateUrl: './general-parameters.component.html',
  styleUrls: ['./general-parameters.component.scss']
})
export class GeneralParametersComponent implements OnInit, OnDestroy {

  instrumentTypeOptions: {name: string; id: string}[];
  charsetOptions: {name: string; id: string}[];
  nullValues = ['Empty Cells'];

  formGroup: FormGroup;
  textareaIsDisabled: boolean = true;
  textareaValue: string = '';
  dropDownInitialState = { emptyCellsChecked: true, nonEmptyCellsChecked: true };

  @ViewChild('emptyCellsCheckbox') emptyCellsCheckbox: ElementRef;
  @ViewChild('nonEmptyCellsCheckbox') nonEmptyCellsCheckbox: ElementRef;
  @ViewChild('textarea') textarea: ElementRef;
  @ViewChild('asNullDropdown') asNullDropdown: ElementRef;

  @Output() toggleErrorMessage = new EventEmitter<{startImportRow: string}>();

  private destroy$ = new Subject();
  private closeDropdown$ = new Subject();

  constructor(
    private fb: FormBuilder,
    private importFromTextFileService: ImportFromTextFileService,
    private clickOutsideService: ClickOutsideService) {}

  ngOnInit(): void {
    this.instrumentTypeOptions = this.mapOptionsForMultiSelect(this.importFromTextFileService.instrumentTypes);
    this.charsetOptions = this.mapOptionsForMultiSelect(charsetTypes);

    const settings = this.importFromTextFileService.settings;
    this.formGroup = this.fb.group({
      instrumentType: settings.instrumentType,
      startImportRow: settings.startImportRow - 1,
      charset: settings.charset,
      nullValues: { 
        value: this.interpretAsNullAsString(settings.nullValues),
        disabled: true
      }
    });

    const formControlValue = this.formGroup.get('nullValues').value;
    this.textareaIsDisabled = !formControlValue || formControlValue === 'Empty Cells';
    this.textareaValue = formControlValue.split(', ').filter(value => value !== 'Empty Cells').join(';');

    this.importFromTextFileService.settingsUpdated
      .pipe(
        filter(updateFormData => updateFormData),
        takeUntil(this.destroy$)
        )
      .subscribe(() => {
        const settings = this.importFromTextFileService.settings;

        this.formGroup.patchValue({
          instrumentType: settings.instrumentType[0],
          startImportRow: settings.startImportRow - 1,
          charset: settings.charset,
          nullValues: settings.nullValues?.map((item: string) => item = (item === '') ? 'Empty Cells' : item).join(', ')
        }, {emitEvent: false, onlySelf: true});
      });

    ['instrumentType', 'startImportRow', 'charset'].forEach(formControl => {
      this.formGroup.get(formControl).valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(value => {
          let valueInSettings = value; 
          if (formControl === 'startImportRow') {
            valueInSettings = +value + 1;
          } else if (formControl === 'instrumentType') {
            valueInSettings = [ value ];
          }

          this.importFromTextFileService.updateSettings(formControl, valueInSettings, true);

          if (formControl === 'startImportRow') {
            if (!(/^[1-9]+$/).test(value)) {
              this.toggleErrorMessage.emit( { startImportRow: 'Start Import Row Value Is Invalid' } );
            } else if (value > 2147483646) {
              this.toggleErrorMessage.emit( { startImportRow: 'Start Import Row Value Is Out Of Range' } );
            } else {
              this.toggleErrorMessage.emit( { startImportRow: '' } );
            }
          }
        });
    })

    this.formGroup.get('nullValues').valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(nullValues => {
        this.importFromTextFileService
          .updateSettings(
            'nullValues', 
            nullValues?.split(',')?.map((item: string) => item === 'Empty Cells' ? '' : item) ?? [],
            true
            );
      });
  }

  instrumentTypeInputDisabled() {
    const instrumentTypeField = this.importFromTextFileService.currentMappings.find(item => item.field.title === 'Instrument Type');
    return !!instrumentTypeField.column;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  settingEdited(key: string) {
    const changedValue = this.importFromTextFileService.editedSettings?.[key];
    if (key === 'instrumentType') {
      return changedValue && changedValue[0] !== this.importFromTextFileService.defaultSettings[key][0];
    }
    if (key === 'nullValues') {
      return changedValue && this.interpretAsNullAsString(changedValue) !== 
        this.interpretAsNullAsString(this.importFromTextFileService.defaultSettings[key]);
    }
    return changedValue && changedValue !== this.importFromTextFileService.defaultSettings[key];
  }

  mapOptionsForMultiSelect(options: string[]) {
    return options.map((option: string) => ({name: option, id: option}))
  }

  toggleAddSymbolDropdown() {
    this.dropDownInitialState = null;
    if (this.asNullDropdown.nativeElement.style.visibility === 'visible') {
      this.asNullDropdown.nativeElement.style.visibility = 'hidden';
      this.closeDropdown$.next();
    } else {
      this.asNullDropdown.nativeElement.style.visibility = 'visible';
      this.clickOutsideService.onOutsideClick(this.asNullDropdown.nativeElement)
        .pipe(skip(1), takeUntil(this.destroy$), takeUntil(this.closeDropdown$))
        .subscribe(() => {
          if (this.asNullDropdown.nativeElement.style.visibility === 'visible') {
            this.asNullDropdown.nativeElement.style.visibility = 'hidden';
            this.closeDropdown$.next();
          }
        });
    }
  }

  settingInvalid(key: string) {
    return this.importFromTextFileService.errorMessages?.[key];
  }

  toggleTextareaIsDisabled(event) {
    this.textareaIsDisabled = !event.target.checked;
    this.textareaValue = '';
  }

  get nonEmptyCellsCheckboxIsChecked() {
    const formControlValue = this.formGroup.get('nullValues').value;
    return formControlValue && formControlValue !== 'Empty Cells';
  }

  get emptyCellsCheckboxIsChecked() {
    const formControlValue = this.formGroup.get('nullValues').value;
    return formControlValue && formControlValue.includes('Empty Cells');
  }

  saveAsnullValues() {
    this.nullValues = [];
    if (this.emptyCellsCheckbox.nativeElement.checked) {
      this.nullValues.push('Empty Cells');
    } else {
      this.nullValues = this.nullValues.filter(item => item !== 'Empty Cells');
    }
    if (this.nonEmptyCellsCheckbox.nativeElement.checked) {
      const symbolsTonullValues = this.textarea.nativeElement.value.trim().split(';');
      this.textareaValue = symbolsTonullValues;
      this.nullValues.push(...symbolsTonullValues);
    } else {
      this.nullValues = this.nullValues.filter(item => item === 'Empty Cells');
    }
    this.formGroup.controls['nullValues'].setValue(this.nullValues.length ? this.nullValues.filter(item => item !== '').toString() : null);
    this.toggleAddSymbolDropdown();
  }

  interpretAsNullAsString(nullValues: string[]) {
    return nullValues?.map((item: string) => item === '' ? 'Empty Cells' : item).join(', ')
  }
}