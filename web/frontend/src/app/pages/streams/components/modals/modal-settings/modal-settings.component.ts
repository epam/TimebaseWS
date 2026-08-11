import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { GlobalFiltersService } from '../../../../../shared/services/global-filters.service';
import { dateFormatsSupported, timeFormatsSupported } from '../../../../../shared/locale.timezone';
import { getTimeZones, getTimeZoneTitle } from '../../../../../shared/utils/timezone.utils';

@Component({
  selector: 'app-modal-settings',
  templateUrl: './modal-settings.component.html',
  styleUrls: ['./modal-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalSettingsComponent implements OnInit, OnDestroy {
  title: string;
  stream: string;
  closeBtnName: string;
  dropdownListDateFormats = [];
  dropdownListTimeFormats = [];
  dropdownListTimeZones = [];
  formGroup: FormGroup;
  
  private destroy$ = new Subject();
  
  constructor(
    public bsModalRef: BsModalRef,
    private globalFiltersService: GlobalFiltersService,
    private cdRef: ChangeDetectorRef,
    private fb: FormBuilder,
  ) {}
  
  ngOnInit() {
    this.dropdownListDateFormats = [...dateFormatsSupported].map((item) => ({name: item, id: item}));
    this.dropdownListTimeFormats = [...timeFormatsSupported].map((item) => ({
      name: item.replace('fffffffff', 'SSS'), 
      id: item
    }));

    this.dropdownListTimeZones = getTimeZones().map((item) => ({name: getTimeZoneTitle(item), id: item.name, offset: item.offset}));
    this.formGroup = this.fb.group({
      dateFormat: null,
      timeFormat: null,
      timezone: null,
      reverseViewIsDefault: null,
      showSpaces: null,
      hideSystemStreams: null,
      showTopics: {value: false, disabled: true}
    });

    this.globalFiltersService.getFilters().pipe(takeUntil(this.destroy$)).subscribe(filters => {
      this.formGroup.patchValue({
        dateFormat: filters.dateFormat[0],
        timeFormat: filters.timeFormat[0],
        timezone: filters.timezone[0].name,
        reverseViewIsDefault: filters.reverseViewIsDefault,
        showSpaces: filters.showSpaces,
        hideSystemStreams: filters.hideSystemStreams,
        showTopics: false
      }, {emitEvent: false});
      this.cdRef.detectChanges();
    });
  
    this.formGroup.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe(data => {
      const timezone = this.dropdownListTimeZones.find((timezone) => timezone.id === data.timezone);
      this.globalFiltersService.setFilters({
        filter_date_format: [data.dateFormat],
        filter_time_format: [data.timeFormat],
        filter_timezone: [{name: timezone.id, nameTitle: timezone.name, offset: timezone.offset, alias: timezone.id}],
        reverseViewIsDefault: data.reverseViewIsDefault,
        showSpaces: data.showSpaces,
        hideSystemStreams: data.hideSystemStreams,
        showTopics: false
      });
    });
  }
  
  clear() {
    this.globalFiltersService.clear();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
