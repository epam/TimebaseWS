import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {AppState} from '../../../../../core/store';
import {dateFormatsSupported, timeFormatsSupported} from '../../../../../shared/locale.timezone';
import {TimeZone} from '../../../../../shared/models/timezone.model';
import {GlobalFiltersService} from '../../../../../shared/services/global-filters.service';
import {getTimeZones, getTimeZoneTitle} from '../../../../../shared/utils/timezone.utils';
import * as fromStreamDetails from '../../../store/stream-details/stream-details.reducer';

@Component({
  selector: 'app-modal-settings',
  templateUrl: './modal-settings.component.html',
  styleUrls: ['./modal-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalSettingsComponent implements OnInit, OnDestroy {
  public title: string;
  public stream: string;
  public closeBtnName: string;
  public dropdownListDateFormats = [];
  public selectedDateFormat = [];
  public dropdownSettingsDateFormat = {};
  public dropdownListTimeFormats = [];
  public selectedTimeFormat = [];
  public dropdownSettingsTimeFormat = {};
  public dropdownListTimeZones = [];
  public selectedTimeZone = [];
  public dropdownSettingsTimeZone = {};

  private destroy$ = new Subject();

  constructor(
    public bsModalRef: BsModalRef,
    private appStore: Store<AppState>,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
    private globalFiltersService: GlobalFiltersService,
    private cdRef: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.dropdownListDateFormats = [...dateFormatsSupported].map((item) => {
      return {name: item};
    });
    this.dropdownListTimeFormats = [...timeFormatsSupported].map((item) => {
      return {name: item};
    });
    this.dropdownListTimeZones = getTimeZones().map((item) => {
      return {nameTitle: this.getTimeZoneName(item), name: item.name, offset: item.offset};
    });
    this.dropdownSettingsDateFormat = {
      singleSelection: true,
      idField: 'name',
      textField: 'name',
    };

    this.dropdownSettingsTimeFormat = {
      singleSelection: true,
      idField: 'name',
      textField: 'name',
    };

    this.dropdownSettingsTimeZone = {
      singleSelection: true,
      idField: 'name',
      textField: 'nameTitle',
      allowSearchFilter: true,
    };

    this.globalFiltersService
      .getFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters) => {
        this.selectedDateFormat = filters.dateFormat.map((item) => ({name: item}));
        this.selectedTimeFormat = filters.timeFormat.map((item) => ({name: item}));
        this.selectedTimeZone = filters.timezone;
        this.cdRef.detectChanges();
      });
  }

  getTimeZoneName(item: TimeZone) {
    return getTimeZoneTitle(item);
  }

  globalSettingsFilter() {
    let filter_date_format = [];
    let filter_time_format = [];

    if (this.selectedDateFormat?.length) {
      filter_date_format = [...this.selectedDateFormat.map((item) => item['name'])];
    }
    if (this.selectedTimeFormat?.length) {
      filter_time_format = [...this.selectedTimeFormat.map((item) => item['name'])];
    }
    if (this.selectedTimeZone?.length) {
      const tzName = this.selectedTimeZone[0].name;
      this.selectedTimeZone = [
        this.dropdownListTimeZones.find((timezone) => timezone.name === tzName),
      ];
    }

    this.globalFiltersService.setFilters({
      filter_date_format,
      filter_time_format,
      filter_timezone: this.selectedTimeZone,
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
