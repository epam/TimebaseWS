import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { getTimeZones, getTimeZoneTitle } from 'src/app/shared/utils/timezone.utils';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { ImportFromTextFileService } from '../../../services/import-from-text-file.service';
import { dateTimeFormats } from 'src/app/shared/utils/dateTimeFormats';
import { takeUntil, filter } from 'rxjs/operators';

@Component({
  selector: 'app-time-parameters',
  templateUrl: './time-parameters.component.html',
  styleUrls: ['./time-parameters.component.scss']
})
export class TimeParametersComponent implements OnInit, OnDestroy {

  dropdownListTimeFormats = [];
  dropdownListTimeZones = [];
  formGroup: FormGroup;
  invalidDateTimeFormat: string;

  private destroy$ = new Subject();

  @Output() toggleErrorMessage = new EventEmitter<{dataTimeFormat: string}>();

  constructor(private fb: FormBuilder, private importFromTextFileService: ImportFromTextFileService) { }

  ngOnInit(): void {
    this.importFromTextFileService.invalidSettings
      .pipe(takeUntil(this.destroy$)).subscribe(invalid => {
        this.invalidDateTimeFormat = invalid ? 'Invalid DateTime Format' : '';
      })

    const selectedTimeFormat = this.importFromTextFileService.settings.dataTimeFormat;
    this.dropdownListTimeFormats = [...dateTimeFormats.filter(item => !item.includes('f'))];
    if (!this.dropdownListTimeFormats.includes(selectedTimeFormat) && !this.invalidDateTimeFormat) {
      this.dropdownListTimeFormats.unshift(selectedTimeFormat);
    }
    
    this.dropdownListTimeZones = getTimeZones()
      .map((item) => ({name: getTimeZoneTitle(item), id: item.name, offset: item.offset}));

    this.formGroup = this.fb.group({
      dataTimeFormat: selectedTimeFormat,
      timeZone: this.importFromTextFileService.settings.timeZone,
    });

    this.importFromTextFileService.settingsUpdated
      .pipe(
        filter(updateFormData => updateFormData),
        takeUntil(this.destroy$)
        )
      .subscribe(() => {
        this.formGroup.patchValue({
          dataTimeFormat: this.importFromTextFileService.settings.dataTimeFormat,
          timeZone: this.importFromTextFileService.settings.timeZone,
        }, {emitEvent: false, onlySelf: true});
      })

    this.formGroup.get('timeZone').valueChanges
      .pipe(takeUntil(this.destroy$)).subscribe(timeZone => {
        this.importFromTextFileService.updateSettings('timeZone', timeZone, true);
      })
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  settingEdited(key: string) {
    const changedValue = this.importFromTextFileService.editedSettings?.[key];
    return changedValue && changedValue !== this.importFromTextFileService.defaultSettings[key];
  }

  settingInvalid(key: string) {
    return this.importFromTextFileService.errorMessages?.[key];
  }

  onTimeFormatChange(event) {
    const regexp = /^[ mdthsz/:.'-]*y{4}[ mdthsz/:.'-]*$/i;
    this.setDropDownStyle();

    if (!regexp.test(event) || event.length < 4) {
      this.invalidDateTimeFormat = 'Invalid Time Format';
      this.toggleErrorMessage.emit( { dataTimeFormat: this.invalidDateTimeFormat } );
    } else {
      this.invalidDateTimeFormat = '';
      this.toggleErrorMessage.emit( { dataTimeFormat: this.invalidDateTimeFormat } );
    }
    this.importFromTextFileService.updateSettings('dataTimeFormat', event.trim().replace(/  +/g, ' '), true);
  }

  setDropDownStyle() {
    const dropdown = document.querySelector('.autocomplete-dropdown-menu-wrapper');
    if (dropdown) {
      dropdown.setAttribute('style', 'background-color: #27384d;border: 1px solid #adadad;border-radius: 4px;box-shadow: none;');
    }
  }
}