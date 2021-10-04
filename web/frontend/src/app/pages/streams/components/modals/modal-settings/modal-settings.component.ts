import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { select, Store } from '@ngrx/store';
import { takeUntil } from 'rxjs/operators';
import { Subject }                                    from 'rxjs';
import { dateFormatsSupported, timeFormatsSupported } from '../../../../../shared/locale.timezone';
import { AppState }                                   from '../../../../../core/store';
import * as fromStreamDetails                         from '../../../store/stream-details/stream-details.reducer';
import { getTimeZoneTitle, getTimeZones }             from '../../../../../shared/utils/timezone.utils';
import { TimeZone }                                   from '../../../../../shared/models/timezone.model';
import { streamsDetailsStateSelector } from '../../../store/stream-details/stream-details.selectors';

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
  public onFilter: any;
  public onClear: any;
  private destroy$ = new Subject();


  constructor(
    public bsModalRef: BsModalRef,
    private appStore: Store<AppState>,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
  ) { }

  ngOnInit() {
    this.dropdownListDateFormats = [...dateFormatsSupported].map(item => {
      return { name: item };
    });
    this.dropdownListTimeFormats = [...timeFormatsSupported].map(item => {
      return { name: item };
    });
    this.dropdownListTimeZones = getTimeZones().map(item => {
      return { nameTitle: this.getTimeZoneName(item), name: item.name, offset: item.offset };
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
    
    this.streamDetailsStore
      .pipe(
        select(streamsDetailsStateSelector),
        takeUntil(this.destroy$),
      )
      .subscribe((state => {
        if (state.global_filter?.filter_date_format?.length) {
          this.selectedDateFormat = state.global_filter.filter_date_format.map(item => ({ name: item }));
        } else {
          this.selectedDateFormat = [];
        }
        if (state.global_filter?.filter_time_format?.length) {
          this.selectedTimeFormat = state.global_filter.filter_time_format.map(item => ({ name: item }));
        } else {
          this.selectedTimeFormat = [];
        }
        if (state.global_filter?.filter_timezone?.length) {
          this.selectedTimeZone = state.global_filter.filter_timezone;
        } else {
          this.selectedTimeZone = [this.dropdownListTimeZones.find(timezone => timezone.name === Intl.DateTimeFormat().resolvedOptions().timeZone)];
          this.globalSettingsFilter();
        }
      }
      ));

  }

  getTimeZoneName(item: TimeZone) {
    return getTimeZoneTitle(item);
  }

  globalSettingsFilter() {
    let filter_date_format = [];
    let filter_time_format = [];
    if (this.selectedDateFormat?.length) {
      filter_date_format = [... this.selectedDateFormat.map(item => item['name'])];
    }
    if (this.selectedTimeFormat?.length) {
      filter_time_format = [... this.selectedTimeFormat.map(item => item['name'])];
    }
    if (this.selectedTimeZone?.length) {
      const tzName = this.selectedTimeZone[0].name;
      this.selectedTimeZone = [this.dropdownListTimeZones.find(timezone => timezone.name === tzName)];
    }

    this.onFilter({
      filter_date_format: filter_date_format,
      filter_time_format: filter_time_format,
      filter_timezone: this.selectedTimeZone,
    });

  }

  clear() {
    this.selectedDateFormat = [];
    this.selectedTimeFormat = [];
    this.onClear();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
