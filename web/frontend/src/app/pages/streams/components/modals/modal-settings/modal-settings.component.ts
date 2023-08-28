import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
}                                                                  from '@angular/core';
import { FormBuilder, FormControl, FormGroup, UntypedFormControl } from '@angular/forms';
import { Store }                                                   from '@ngrx/store';
import equal                                                       from 'fast-deep-equal/es6';
import { BsModalRef }                                              from 'ngx-bootstrap/modal';
import { Observable, Subject }                                                     from 'rxjs';
import { distinctUntilChanged, map, shareReplay, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { AppState }                                                                from '../../../../../core/store';
import { dateFormatsSupported, timeFormatsSupported }              from '../../../../../shared/locale.timezone';
import { TimeZone }                                                from '../../../../../shared/models/timezone.model';
import { GlobalFiltersService }                                    from '../../../../../shared/services/global-filters.service';
import { getTimeZones, getTimeZoneTitle }                          from '../../../../../shared/utils/timezone.utils';
import * as fromStreamDetails
                                                                   from '../../../store/stream-details/stream-details.reducer';

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
    private appStore: Store<AppState>,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
    private globalFiltersService: GlobalFiltersService,
    private cdRef: ChangeDetectorRef,
    private fb: FormBuilder,
  ) {}
  
  ngOnInit() {
    this.dropdownListDateFormats = [...dateFormatsSupported].map((item) => ({name: item, id: item}));
    this.dropdownListTimeFormats = [...timeFormatsSupported].map((item) => ({name: item, id: item}));
    this.dropdownListTimeZones = getTimeZones().map((item) => ({name: getTimeZoneTitle(item), id: item.name, offset: item.offset}));
    this.formGroup = this.fb.group({
      dateFormat: null,
      timeFormat: null,
      timezone: null,
      showSpaces: null,
    });
  
    this.globalFiltersService.getFilters().pipe(takeUntil(this.destroy$)).subscribe(filters => {
      this.formGroup.patchValue({
        dateFormat: filters.dateFormat[0],
        timeFormat: filters.timeFormat[0],
        timezone: filters.timezone[0].name,
        showSpaces: filters.showSpaces,
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
        showSpaces: data.showSpaces,
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
