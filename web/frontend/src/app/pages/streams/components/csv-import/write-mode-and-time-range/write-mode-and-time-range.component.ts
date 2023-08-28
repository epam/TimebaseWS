import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ReplaySubject } from 'rxjs';
import { WriteMode } from 'src/app/shared/components/write-modes-control/write-mode';
import { GlobalFiltersService } from 'src/app/shared/services/global-filters.service';
import { ImportFromTextFileService } from '../../../services/import-from-text-file.service';

@Component({
  selector: 'app-write-mode-and-time-range',
  templateUrl: './write-mode-and-time-range.component.html',
  styleUrls: ['./write-mode-and-time-range.component.scss']
})
export class WriteModeAndTimeRangeComponent implements OnInit {

  writeModeControl = new UntypedFormControl(WriteMode.append);
  defaultTimeRangeValue: string;
  endTimeMin: string;
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

  private destroy$ = new ReplaySubject(1);
  public selectedTimezone = 'UTC';

  constructor(private importFromTextFileService: ImportFromTextFileService, private globalFiltersService: GlobalFiltersService) { }

  ngOnInit(): void {
    this.defaultTimeRangeValue = (new Date()).toISOString();

    this.startTime = this.importFromTextFileService.settings.startTime ?? this.defaultTimeRangeValue;
    this.endTime = this.importFromTextFileService.settings.endTime ?? this.defaultTimeRangeValue;
    this.endTimeMin = this.startTime;

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
    this.inputsInvalid = {
      startTime: false,
      endTime: false
    };
    this.inputsAreDisabled[formControlName] = !event.target.checked;

    if (event.target.checked && !this.importFromTextFileService.settings[formControlName]) {
      this.importFromTextFileService.updateSettings(formControlName, this.defaultTimeRangeValue);
    }
    
    const allControlsAreEnabled = !this.inputsAreDisabled.startTime && !this.inputsAreDisabled.endTime;
    if (this.startTime > this.endTime && allControlsAreEnabled) {
      this.timeRangeValidationError = 'End Time should be greater than Start Time';
      this.inputsInvalid = {
        startTime: true,
        endTime: true
      };
    }
  }

  onTimeChange(event: Date, startOrEnd: string) {
    this.timeRangeValidationError = '';
    this.inputsInvalid = {
      startTime: false,
      endTime: false
    };
    const newDate = event.toISOString();
    this[startOrEnd] = newDate;
    if (startOrEnd === 'startTime') {
      this.endTimeMin = this.startTime;
    }

    const allControlsAreEnabled = !this.inputsAreDisabled.startTime && !this.inputsAreDisabled.endTime;
    if (this.startTime > this.endTime && allControlsAreEnabled) {
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
  }
}