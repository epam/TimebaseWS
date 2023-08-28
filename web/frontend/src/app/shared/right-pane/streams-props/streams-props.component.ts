import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  Input
} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {select, Store} from '@ngrx/store';
import equal from 'fast-deep-equal';
import {combineLatest, Observable, Subject, BehaviorSubject} from 'rxjs';
import {distinctUntilChanged, filter, map, shareReplay, switchMap, takeUntil, first, tap} from 'rxjs/operators';
import {AppState} from '../../../core/store';
import {TabSettingsModel} from '../../../pages/streams/models/tab.settings.model';
import * as StreamPropsActions from '../../../pages/streams/store/stream-props/stream-props.actions';
import * as fromStreamProps from '../../../pages/streams/store/stream-props/stream-props.reducer';
import {getActiveTab, getActiveTabSettings} from '../../../pages/streams/store/streams-tabs/streams-tabs.selectors';
import {formatHDate} from '../../locale.timezone';
import {GlobalFilters} from '../../models/global-filters';
import {GlobalFiltersService} from '../../services/global-filters.service';
import {StreamsService} from '../../services/streams.service';
import {SymbolsService} from '../../services/symbols.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { streamNameUpdateData } from 'src/app/pages/streams/models/stream-update-data.model';
import { PermissionsService } from '../../services/permissions.service';
import { ViewInfoFormatted } from '../view-properties/view-properties.component';
import { ViewsService } from '../../services/views.service';

@Component({
  selector: 'app-streams-props',
  templateUrl: './streams-props.component.html',
  styleUrls: ['./streams-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamsPropsComponent implements OnInit, OnDestroy {
  @Output() closedPropsEmit = new EventEmitter<boolean>();

  isWriter$: Observable<boolean>;
  isSymbol$: Observable<boolean>;
  closedProps: boolean;
  props;
  propsSubject = new BehaviorSubject([]);
  streamProps = [];
  symbolProps = [];
  periodisityType: string;
  tabSettings$: Observable<TabSettingsModel>;
  tabSettings: TabSettingsModel = {};
  title$: Observable<string>;
  notView$: Observable<boolean>;

  editingProps = new Set();
  changedProps = new Set();

  timeIntervals = ['Second', 'Minute', 'Hour', 'Day', 'Week', 'Month', 'Quarter', 'Year'];
  periodicityTypes = ['Regular', 'Irregular', 'Static'];
  savedPeriodicityType: string;

  form: FormGroup;
  periodicityForm: FormGroup;

  streamId: string;
  errorMessages = {
    interval: '',
    timeUnit: '',
    key: '',
    name: ''
  };

  viewFields = ['stream', 'state', 'lastTimestampFormatted', 'query'];

  private destroy$ = new Subject();
  infoFormatted$: Observable<ViewInfoFormatted>;

  constructor(
    private route: ActivatedRoute,
    private appStore: Store<AppState>,
    private viewsService: ViewsService,
    private cdr: ChangeDetectorRef,
    private globalFiltersService: GlobalFiltersService,
    private symbolsService: SymbolsService,
    private streamsService: StreamsService,
    private fb: FormBuilder,
    private permissionsService: PermissionsService
  ) {}

  ngOnInit() {
    this.tabSettings$ = this.appStore.pipe(select(getActiveTabSettings));
    this.notView$ = this.appStore.pipe(select(getActiveTab)).pipe(map(tab => !tab?.isView));
    this.isWriter$ = this.permissionsService.isWriter();

    this.tabSettings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((settings: TabSettingsModel) => (this.tabSettings = settings));

    const routeParams$ = this.route.params as Observable<{stream: string; symbol: string}>;
    this.isSymbol$ = routeParams$.pipe(map((tab) => !!tab.symbol));

    this.isSymbol$.pipe(
      filter(isSymbol => !!isSymbol),
      switchMap(() => this.propsSubject),
      takeUntil(this.destroy$)
      ).subscribe(props => {
        this.streamProps = props.filter(prop => !prop.key.includes('symbol'));
        this.symbolProps = props.filter(prop => prop.key.includes('symbol'));
      })

    const props$ = routeParams$.pipe(
      switchMap((tab) => {
        return tab.symbol
          ? this.symbolsService.getProps(tab.stream, tab.symbol)
          : this.streamsService.getProps(tab.stream);
      }),
      shareReplay(1),
    );

    const props = combineLatest([this.globalFiltersService.getFilters(), props$]).pipe(
      distinctUntilChanged(equal),
      filter(([filters, props]) => !!props),
      map(([filters, props]: [GlobalFilters, fromStreamProps.State]) => {
        return this.formatProps(JSON.parse(JSON.stringify(props)).props, filters);
      }),
    );

    this.form = this.fb.group({
      key: [''],
      name: [''], 
      description: '',
    });

    this.periodicityForm = this.fb.group({
      intervalNumber: '',
      timeUnit: '',
      type: '',
    });

    props.pipe(
      tap(props => {
        this.streamId = props.find(item => item.key === 'key')?.value;
        if (!this.streamId) {
          this.errorMessages = null;
        }
        this.props = props;
        this.propsSubject.next(props);
        this.updateFormData();
      }),
      switchMap(() => this.periodicityForm.get('type').valueChanges),
      takeUntil(this.destroy$)
    )
    .subscribe(value => {
      const periodicityProps = this.props.find(prop => prop.key === 'periodicity').children;
      const intervalIndex = periodicityProps.findIndex(child => child.key === 'interval');

      if (value === 'Regular' && this.periodisityType !== value.toUpperCase()) {
        this.periodicityForm.patchValue({ intervalNumber: 1, timeUnit: 'Day' }, );
        periodicityProps[intervalIndex] = {
          ...periodicityProps[intervalIndex],
          value: '1 DAY'
        }
      }
      this.updateValidationErrors('interval', '');
      this.updateValidationErrors('timeUnit', '');
      this.periodisityType = value?.toUpperCase();
      if (!['REGULAR', 'IRREGULAR', 'STATIC'].includes(this.periodisityType)) {
        this.updateValidationErrors('interval', "Periodicity type must be 'Regular', 'Irregular' or 'Static'");
      }
    });

    this.periodicityForm.get('intervalNumber').valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.updateValidationErrors('interval', '');
        if (value === null) {
          this.updateValidationErrors('interval', 'Periodicity Interval is required');
        } else if (value !== null && value < 1) {
          this.updateValidationErrors('interval', 'Periodicity Interval cannot be less than 1');
        } else if (value !== null && value % 1) {
          this.updateValidationErrors('interval', 'Periodicity Interval must be an integer');
        }
        if (this.periodisityType !== 'REGULAR') {
          this.updateValidationErrors('interval', '');
        }
      });

    this.periodicityForm.get('timeUnit').valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.updateValidationErrors('timeUnit', '');
        if (!value) {
          this.updateValidationErrors('timeUnit', 'Time Unit is required');
        }
        if (this.periodisityType !== 'REGULAR') {
          this.updateValidationErrors('timeUnit', '');
        }
      });

    ['name', 'key'].forEach(key => {
      this.form.get(key).valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(value => {
          this.updateValidationErrors(key, '');
          if (!value && this.streamId) {
            this.updateValidationErrors(key, `${key} is required`);
          }
        })
    })

    const info$ = this.appStore.pipe(
      select(getActiveTab),
      filter(t => !!t),
      distinctUntilChanged((t1, t2) => t1.id === t2.id),
      switchMap(tab => this.viewsService.get(tab.streamName)),
    );

    this.infoFormatted$ = combineLatest([
      info$,
      this.globalFiltersService.getFilters(),
    ]).pipe(map(([info, filters]) => {
      return {
        ...info,
        lastTimestampFormatted: info.lastTimestamp > 0 ? formatHDate(
          new Date(info.lastTimestamp).toISOString(),
          filters.dateFormat,
          filters.timeFormat,
          filters.timezone,
        ) : null,
      };
    }));
  }

  ngOnDestroy(): void {
    this.appStore.dispatch(new StreamPropsActions.StopSubscriptions());
  }

  private updateValidationErrors(key: string, value: string) {
    this.errorMessages = {
      ...this.errorMessages,
      [key]: value
    }
  }

  get validationErrors() {
    return Object.values(this.errorMessages ?? {}).some(message => message !== '');
  }

  private formatProps(
    props: any,
    filters: GlobalFilters,
  ): {key: string; value: string; children: any[]}[] {
    if (!props) {
      return [];
    }

    return Object.keys(props).map((key) => {
      let value = ['string', 'number'].includes(typeof props[key]) ? props[key] : null;
      if (['start', 'end'].includes(key)) {
        value = formatHDate(value, filters.dateFormat, filters.timeFormat, filters.timezone);
      }
      return {
        key,
        value,
        children: typeof props[key] === 'object' ? this.formatProps(props[key], filters) : [],
      };
    });
  }

  updateFormData() {
    const periodicityProps = this.props.find(prop => prop.key === 'periodicity').children;
  
    const timeInterval = periodicityProps.find(child => child.key === 'interval').value?.toLowerCase().split(' ');
    this.periodisityType = periodicityProps.find(child => child.key === 'type').value.toUpperCase();
    this.savedPeriodicityType = this.periodisityType;

    this.form.patchValue({
      key: this.streamId ?? '',
      name: this.props.find(item => item.key === 'name')?.value ?? '',
      description: this.props.find(item => item.key === 'description')?.value ?? '',
      emitEvent: false, 
      onlySelf: true
    });

    this.periodicityForm.patchValue({
      intervalNumber: timeInterval ? timeInterval[0] : '',
      timeUnit: timeInterval ? timeInterval[1].charAt(0).toUpperCase() + timeInterval[1].slice(1) : '',
      type: this.periodisityType.charAt(0) + this.periodisityType.slice(1).toLowerCase(),
      emitEvent: false, 
      onlySelf: true
    });
  }

  togglePropertyEditing(key: string) {
    if (this.editingProps.has(key)) {
      this.editingProps.delete(key);
      this.updateValidationErrors(key, '');
      this.updateFormData();
    } else {
      this.editingProps.add(key);
      if (key === 'interval') {
        this.editingProps.delete('type');
      }
      if (key === 'type') {
        this.editingProps.delete('interval');
      }
    }
  }

  saveProperty(key: string, value: string = '') {
    if (['name', 'key', 'description'].includes(key)) {  
      this.streamsService.updateStreamProperties(this.streamId, { [key]: value })
        .pipe(first(), takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            const editingIndex = this.props.findIndex(prop => prop.key === key);
            this.props[editingIndex] = {
              ...this.props[editingIndex],
              value
            }
            this.propsSubject.next(this.props);
            this.editingProps.delete(key);
            if (key === 'key') {
              this.streamId = value;

              setTimeout(() => {
                const updateProps: streamNameUpdateData  = {
                  streamId: this.streamId,
                  newStreamName: this.props.find(item => item.key === 'name')?.value
                }
                this.streamsService.streamNameUpdated.next(updateProps);
              }, 2000);

            }
            this.changedProps.add(key);
            if (key === 'name') {
              const updateProps: streamNameUpdateData  = {
                streamId: this.streamId,
                newStreamName: value
              }
              this.streamsService.streamNameUpdated.next(updateProps);
            }
          },
          error: () => {
            this.form.patchValue({ [key]: this.props.find(item => item.key === key).value ?? '', });
          }
        });
      
    } else {
      this.editingProps.delete(key);
      const periodicityProps = this.props.find(prop => prop.key === 'periodicity').children;
      const intervalIndex = periodicityProps.findIndex(child => child.key === 'interval');

      if (key === 'type') {
        const typeIndex = periodicityProps.findIndex(child => child.key === 'type');
        periodicityProps[typeIndex] = {
          ...periodicityProps[typeIndex],
          value: this.periodisityType.toUpperCase()
        }
        this.savedPeriodicityType = this.periodisityType.toUpperCase();
        const body: any = {
          periodicity: {
            type: periodicityProps[typeIndex].value,
          }
        }
        if (periodicityProps[typeIndex].value === 'REGULAR') {
          body.periodicity.interval = periodicityProps[intervalIndex].value;
          this.editingProps.add('interval');
        }

        this.streamsService.updateStreamProperties(this.streamId, body)
          .pipe(first(), takeUntil(this.destroy$))  
          .subscribe(() => {
            this.propsSubject.next(this.props);
            this.changedProps.add(key);
          });

      } else {
        const interval = `${this.periodicityForm.get('intervalNumber').value} ${this.periodicityForm.get('timeUnit').value?.toUpperCase()}`;
        periodicityProps[intervalIndex] = {
          ...periodicityProps[intervalIndex],
          value: interval
        }
        this.streamsService.updateStreamProperties(this.streamId, { periodicity: { interval: periodicityProps[intervalIndex].value } })
          .pipe(first(), takeUntil(this.destroy$))  
          .subscribe((result: any) => {
            this.propsSubject.next(this.props);
            this.changedProps.add(key);
            const [number, units] = result.periodicity.interval.split(' ');
            this.streamsService.streamPeriodicityUpdated.next({ 
              streamId: this.streamId, 
              period: {
                aggregation: result.periodicity.milliseconds, 
                name: result.periodicity.interval.toLowerCase(), 
                units: units.toUpperCase(), 
                number: +number
              }
          })
        });
      }
    }
  }
}