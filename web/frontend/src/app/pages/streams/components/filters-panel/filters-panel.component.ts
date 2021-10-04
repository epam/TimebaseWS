import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
}                                                                                from '@angular/core';
import { ActivatedRoute, Data, Params }                                          from '@angular/router';
import { HdDate }                                                                from '@assets/hd-date/hd-date';
import { select, Store }                                                         from '@ngrx/store';
import { BsDatepickerConfig, BsDatepickerDirective, BsModalRef, BsModalService } from 'ngx-bootstrap';
import { Observable, Subject }                                                   from 'rxjs';
import { distinctUntilChanged, filter, take, takeUntil, withLatestFrom }         from 'rxjs/operators';
import { AppState }                                                              from '../../../../core/store';
// import { streamsDetailsStateSelector } from '../../store/stream-details/stream-details.selectors';
import { getLocaleDateString }                                                   from '../../../../shared/locale.timezone';
import {
  dateToUTC,
  hdDateTZ,
}                                                                                from '../../../../shared/utils/timezone.utils';
import { FilterModel }                                                           from '../../models/filter.model';
import { TabModel }                                                              from '../../models/tab.model';
import * as FilterActions
                                                                                 from '../../store/filter/filter.actions';
import * as StreamDetailsActions
                                                                                 from '../../store/stream-details/stream-details.actions';
import { StreamDetailsEffects }                                                  from '../../store/stream-details/stream-details.effects';
import * as fromStreamDetails
                                                                                 from '../../store/stream-details/stream-details.reducer';
import {
  getStreamGlobalFilters,
  getStreamSymbols,
  streamsDetailsStateSelector,
}                                                                                from '../../store/stream-details/stream-details.selectors';
import * as fromStreamProps
                                                                                 from '../../store/stream-props/stream-props.reducer';
import {
  getActiveOrFirstTab,
  getActiveTab,
  getActiveTabFilters,
  getTabs,
}                                                                                from '../../store/streams-tabs/streams-tabs.selectors';
import { ModalFilterComponent }                                                  from '../modals/modal-filter/modal-filter.component';

const now = new HdDate();

export const toUtc = (date: any) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(newDate.getMilliseconds() + now.getTimezoneOffset() * 60 * 1000);
  return newDate;
};

export const fromUtc = (date: any) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(newDate.getMilliseconds() - now.getTimezoneOffset() * 60 * 1000);
  return newDate;
};


@Component({
  selector: 'app-filters-panel',
  templateUrl: './filters-panel.component.html',
  styleUrls: ['./filters-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})

export class FiltersPanelComponent implements OnInit, OnDestroy {
  @Input() hideTimePicker = false;
  public currentDateTimeFullHoursFrom: Date;
  public format: string;
  private destroy$ = new Subject();
  public activeTab: Observable<TabModel>;
  public live: boolean;
  private reverse: boolean;
  private filteredStartDate: boolean;
  private dateFirst: HdDate;
  private propsState: Observable<fromStreamProps.State>;
  public bsModalRef: BsModalRef;
  public schema = [];
  public symbols = [];
  public streamName: string;
  public tabName: string;
  public filteredTypesSymbols: boolean;
  public streamDetails: Observable<fromStreamDetails.State>;
  private filterTimezone;
  public bsConfig: Partial<BsDatepickerConfig>;
  @ViewChild('dp') datepicker: BsDatepickerDirective;
  @ViewChild('btn') btn: ElementRef;

  constructor(
    private appStore: Store<AppState>,
    private route: ActivatedRoute,
    private modalService: BsModalService,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
    private streamDetailsEffects: StreamDetailsEffects,
    private streamPropsStore: Store<fromStreamProps.FeatureState>,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    // this.format = getLocaleDateString() + ' HH:mm:ss.fff';
    this.activeTab = this.appStore.pipe(select(getActiveOrFirstTab));
    this.appStore
      .pipe(
        select(getStreamSymbols),
        takeUntil(this.destroy$),
      )
      .subscribe(symbols => {
          if (symbols?.length) {
            this.symbols = [...symbols.filter(Boolean)];
          }
        },
      );

    this.streamDetails = this.streamDetailsStore.pipe(select(streamsDetailsStateSelector));
    this.appStore
      .pipe(
        select(getStreamGlobalFilters),
        filter(global_filter => !!global_filter),
        takeUntil(this.destroy$),
        distinctUntilChanged(),
      )
      .subscribe(action => {
        let filter_date_format = getLocaleDateString();
        let filter_time_format = 'HH:mm:ss SSS';

        if (action.filter_date_format && action.filter_date_format.length) {
          filter_date_format = action.filter_date_format[0];

        }
        if (action.filter_time_format && action.filter_time_format.length) {
          filter_time_format = action.filter_time_format[0];
        }
        if (action.filter_timezone && action.filter_timezone.length) {
          this.filterTimezone = action.filter_timezone[0];
        } else {
          this.filterTimezone = null;
        }

        this.format = filter_date_format.toUpperCase() + ' ' + filter_time_format;
        this.format = this.format.replace('tt', 'A');
        this.format = this.format.replace(/f/g, 'S');
        this.bsConfig = Object.assign({}, {
          containerClass: 'theme-default',
          dateInputFormat: this.format,
        });
        if (this.btn) {
          this.btn.nativeElement.dispatchEvent(new MouseEvent('click'));
          this.btn.nativeElement.dispatchEvent(new MouseEvent('click'));
        }
        this.cdr.detectChanges();

      });

    this.propsState = this.streamPropsStore.pipe(select('streamProps'));
    this.propsState
      .pipe(
        filter(props => !!props),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(props => {
        let dateEnd: number;
        let dateStart: number;
        if (props.props && props.props.range && props.props.range.end && props.props.range.start) {
          const end = props.props.range.end;
          const start = props.props.range.start;
          dateEnd = new Date(end).getTime();
          dateStart = new Date(start).getTime();
        }
        if (this.reverse) {
          if (props.props && props.props.range && props.props.range.end) {
            this.dateFirst = toUtc(new HdDate(new Date(dateEnd).toISOString()));
          } else {
            this.dateFirst = toUtc(new HdDate());
          }
        } else if (!this.live) {
          if (props.props && props.props.range && props.props.range.start) {
            this.dateFirst = toUtc(new HdDate(new Date(dateStart).toISOString()));

          } else {
            this.dateFirst = toUtc(new HdDate());
          }
        } else if (this.live) {
          if (props.props && props.props.range && props.props.range.end) {
            this.dateFirst = toUtc(new HdDate(new Date(dateEnd + 1).toISOString()));
          } else {
            this.dateFirst = toUtc(new HdDate());
          }
        }

        if (!this.filteredStartDate) {
          if (this.dateFirst) {
            this.currentDateTimeFullHoursFrom = this.checkFilterTimezoneDate(this.dateFirst);
          }
        }
      });

    this.appStore
      .pipe(
        select(getTabs),
        filter((tabs) => !!tabs),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe((tabs: TabModel[]) => {
        this.route.params
          .pipe(
            withLatestFrom(this.route.data),
            withLatestFrom(this.route.queryParams),
            takeUntil(this.destroy$),
          )
          .subscribe(([[params, data], queryParams]: [[{ stream: string, id: string, symbol?: string }, Data], Params]) => {
            // this.streamDetailsStore.dispatch(new StreamDetailsActions.GetSymbols({streamId: params.stream}));
            this.streamDetailsStore.dispatch(new StreamDetailsActions.GetSymbols({
              streamId: params.stream,
              ...(queryParams.space ? {spaceId: queryParams.space} : {}),
            }));
            this.tabName = params.stream;
            if (params.symbol) {
              this.tabName = params.stream + params.symbol;
            }

            this.live = data.hasOwnProperty('live');
            this.reverse = data.hasOwnProperty('reverse');

            this.streamDetailsEffects
              .setSchema
              .pipe(
                // take(1),
                takeUntil(this.destroy$),
              )
              .subscribe(action => {
                if (action.payload.schema && action.payload.schema.length) {
                  this.schema = [...action.payload.schema];
                }
              });


          });
      });


    this.appStore
      .pipe(
        select(getActiveTabFilters),
        filter((filter) => !!filter),
        takeUntil(this.destroy$),
      )
      .subscribe((filter: FilterModel) => {
        if (filter.from && !this.filterTimezone) {
          this.currentDateTimeFullHoursFrom = new Date(filter.from);
          this.filteredStartDate = true;
        } else if (filter.from && this.filterTimezone) {
          this.currentDateTimeFullHoursFrom = this.checkFilterTimezoneDate(toUtc(new HdDate(filter.from)));
          this.filteredStartDate = true;
        } else {
          this.currentDateTimeFullHoursFrom = null;
          this.filteredStartDate = false;
        }
        this.filteredTypesSymbols = !!((filter.filter_symbols && filter.filter_symbols.length) || (filter.filter_types && filter.filter_types.length));
        this.cdr.markForCheck();

      });
  }

  setConfig() {
    if (this.datepicker) {
      this.currentDateTimeFullHoursFrom = new Date(this.currentDateTimeFullHoursFrom);
      this.datepicker.setConfig();
    }
    this.cdr.detectChanges();
  }

  onClearFilter() {
    this.appStore.dispatch(new FilterActions.CleanFilter());
    this.currentDateTimeFullHoursFrom = this.checkFilterTimezoneDate(this.dateFirst);
    this.filteredStartDate = false;
  }

  onDateFromChange(event: any) {
    // console.log(event);
  }

  checkFilterTimezone(date: HdDate) {
    if (this.filterTimezone && date) {
      const dateTimeZone = hdDateTZ(date, this.filterTimezone.name);
      return toUtc(dateTimeZone);
    }
    return fromUtc(date);

  }

  checkFilterTimezoneDate(date: any) {
    if (this.filterTimezone && date) {
      const dateTimeZone = hdDateTZ(date, this.filterTimezone.name);
      return new Date(toUtc(dateTimeZone).getEpochMillis());
    }
    return new Date(fromUtc(date).getEpochMillis());

  }


  filterTimezoneUTC(date: HdDate, filterTimezone = 'GMT') {
    const dateTimeZone = hdDateTZ(date, filterTimezone);
    return toUtc(dateTimeZone);
  }

  public onFilterSubmit() {
    const filter = {};
    if (this.currentDateTimeFullHoursFrom) {
      filter['from'] = this.currentDateTimeFullHoursFrom.toISOString();
      if (this.filterTimezone) {
        filter['from'] = dateToUTC(this.currentDateTimeFullHoursFrom, this.filterTimezone.name).toISOString();
      }
      //   this.filteredStartDate = true;
    }

    this.appStore.dispatch(new FilterActions.AddFilters({
      filter: filter,
    }));
  }

  openFilterModalWithComponent() {
    this.appStore.pipe(select(getActiveTab), take(1)).subscribe(tab => {
      const initialState = {
        title: 'Symbols & Message Types Filter',
        types: this.schema,
        symbols: this.symbols,
        isStream: !tab.symbol,
      };
  
      this.bsModalRef = this.modalService.show(ModalFilterComponent, {initialState,
        class: 'modal-filter',
      });
      this.bsModalRef.content.onFilter = (data) => {
    
        if (data.filter_types && data.filter_types.length) {
          const filterTypes = {};
          filterTypes['filter_types'] = data.filter_types;
          this.appStore.dispatch(new FilterActions.AddFilters({
            filter: filterTypes,
          }));
      
        } else {
          this.appStore.dispatch(new FilterActions.RemoveFilter({
            filterName: 'filter_types',
          }));
        }
    
        if (data.filter_symbols && data.filter_symbols.length) {
          const filterSymbols = {};
          filterSymbols['filter_symbols'] = data.filter_symbols;
          this.appStore.dispatch(new FilterActions.AddFilters({
            filter: filterSymbols,
          }));
        } else {
          this.appStore.dispatch(new FilterActions.RemoveFilter({
            filterName: 'filter_symbols',
          }));
        }
        this.filteredTypesSymbols = !!((data.filter_symbols && data.filter_symbols.length) || (data.filter_types && data.filter_types.length));
    
    
      };
  
      this.bsModalRef.content.onClear = () => {
        this.filteredTypesSymbols = false;
        this.appStore.dispatch(new FilterActions.RemoveFilter({
          filterName: 'filter_symbols',
        }));
        this.appStore.dispatch(new FilterActions.RemoveFilter({
          filterName: 'filter_types',
        }));
      };
  
      this.bsModalRef.content.closeBtnName = 'Close';
    });
    
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
