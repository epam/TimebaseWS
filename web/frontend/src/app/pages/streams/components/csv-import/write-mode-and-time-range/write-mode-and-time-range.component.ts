import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ReplaySubject } from 'rxjs';
import { WriteMode } from 'src/app/shared/components/write-modes-control/write-mode';
import { ImportFromTextFileService } from '../../../services/import-from-text-file.service';

@Component({
  selector: 'app-write-mode-and-time-range',
  templateUrl: './write-mode-and-time-range.component.html',
  styleUrls: ['./write-mode-and-time-range.component.scss']
})
export class WriteModeAndTimeRangeComponent implements OnInit {

  writeModeControl = new UntypedFormControl(WriteMode.rewrite);
  defaultTimeRangeValue: string;
  endTimeMin: string;
  timeValueValidationError = { startTime: '', endTime: '' };
  timeRangeValidationError: string = '';
  startTime: string;
  endTime: string;
  inputsAreDisabled = {
    startTime: true,
    endTime: true
  }
  inputsInvalid = {
    startTime: false,
    endTime: false
  }
  form: FormGroup;

  private destroy$ = new ReplaySubject(1);
  public selectedTimezone = 'UTC';

  @Output() updateValidity = new EventEmitter<boolean>();
  constructor(private importFromTextFileService: ImportFromTextFileService, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.defaultTimeRangeValue = (new Date()).toISOString();
    this.startTime = this.importFromTextFileService.settings.startTime ?? this.defaultTimeRangeValue;
    this.endTime = this.importFromTextFileService.settings.endTime ?? this.defaultTimeRangeValue;
    this.endTimeMin = this.startTime;

    this.form = this.fb.group({
      startTime: this.startTime,
      endTime: this.endTime,
    }, {validators: [ this.validateRange ]},);

    this.writeModeControl.patchValue(this.importFromTextFileService.settings.writeMode);
  }

  setWriteMode(event: MouseEvent) {
    this.importFromTextFileService.updateSettings('writeMode', (event.target as HTMLElement).innerHTML, true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleInputDisabled(formControlName: string, event) {
    this.timeRangeValidationError = '';
    this.inputsAreDisabled[formControlName] = !event.target.checked;
    if (!event.target.checked) {
      this.inputsInvalid = {
        ...this.inputsInvalid,
        [formControlName]: false
      };
      this.timeValueValidationError[formControlName] = '';
    } else {
      this.form.updateValueAndValidity();
    } 

    if (event.target.checked && !this.importFromTextFileService.settings[formControlName]) {
      this.importFromTextFileService.updateSettings(formControlName, this.defaultTimeRangeValue);
    }
    
    const allControlsAreEnabled = !this.inputsAreDisabled.startTime && !this.inputsAreDisabled.endTime;
    const allControlsAreValid = this.form.value.startTime !== 'Invalid Date' && this.form.value.endTime !== 'Invalid Date';
    if (this.startTime > this.endTime && allControlsAreEnabled && allControlsAreValid) {
      this.timeRangeValidationError = 'End Time should be greater than Start Time';
      this.inputsInvalid = {
        startTime: true,
        endTime: true
      };
    }
    this.updateRangeValidity();
  }

  private updateRangeValidity() {
    this.updateValidity.next(!this.timeValueValidationError.startTime && !this.timeValueValidationError.endTime
      && !this.timeRangeValidationError);
  }

  onTimeChange(newDate: Date, startOrEnd: string) {
    this.timeRangeValidationError = '';
    this.inputsInvalid = {
      startTime: false,
      endTime: false
    };
    this[startOrEnd] = newDate;
    if (startOrEnd === 'startTime') {
      this.endTimeMin = this.startTime;
    }

    const allControlsAreEnabled = !this.inputsAreDisabled.startTime && !this.inputsAreDisabled.endTime;
    const allControlsAreValid = this.form.value.startTime !== 'Invalid Date' && this.form.value.endTime !== 'Invalid Date';
    if (this.startTime > this.endTime && allControlsAreEnabled && allControlsAreValid) {
      if (!this.inputsAreDisabled.endTime) {
        this.importFromTextFileService.updateSettings('endTime', newDate);
      }
      this.timeRangeValidationError = 'End Time should be greater than Start Time';
      this.inputsInvalid = {
        startTime: true,
        endTime: true
      };
    }
    if (!this.inputsAreDisabled[startOrEnd]) {
      this.importFromTextFileService.updateSettings(startOrEnd, newDate);
    }
    this.updateRangeValidity();
  }

  private validateRange = (fg: UntypedFormGroup) => {
    this.timeValueValidationError = { startTime: '', endTime: '' };
    if ((!fg.value.startTime || fg.value.startTime === 'Invalid Date') && !this.inputsAreDisabled.startTime) {
      this.timeValueValidationError.startTime = 'Start time is invalid';
      this.inputsInvalid = {
        ...this.inputsInvalid,
        startTime: true,
      };
    }
    if ((!fg.value.endTime || fg.value.endTime === 'Invalid Date') && !this.inputsAreDisabled.endTime) {
      this.timeValueValidationError.endTime = 'End time is invalid';
      this.inputsInvalid = {
        ...this.inputsInvalid,
        endTime: true
      };
    }
    this.updateRangeValidity();
    return (this.timeValueValidationError.startTime || this.timeValueValidationError.endTime) ? 
      { dateInvalid: true } : null;
  }
}