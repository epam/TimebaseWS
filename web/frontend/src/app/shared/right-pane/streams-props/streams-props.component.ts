import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {select, Store} from '@ngrx/store';
import equal from 'fast-deep-equal';
import {combineLatest, Observable, Subject, BehaviorSubject, forkJoin} from 'rxjs';
import {
  distinctUntilChanged, filter, map, shareReplay, switchMap, takeUntil, first, tap, pluck, withLatestFrom, take
} from 'rxjs/operators';
import {AppState} from '../../../core/store';
import {TabSettingsModel} from '../../../pages/streams/models/tab.settings.model';
import * as StreamPropsActions from '../../../pages/streams/store/stream-props/stream-props.actions';
import * as fromStreamProps from '../../../pages/streams/store/stream-props/stream-props.reducer';
import {
  getActiveTab, getActiveTabSettings, getActiveOrFirstTab
} from '../../../pages/streams/store/streams-tabs/streams-tabs.selectors';
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
import { TabModel } from 'src/app/pages/streams/models/tab.model';
import { ChartService } from '../../services/chart-service';
import { forbiddenChars, forbiddenCharsForMessage } from '../../utils/forbiddenCharacters';
import { StructureUpdatesService } from 'src/app/pages/streams/services/structure-updates.service';

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
    periodicity: '',
    time_unit: '',
    key: '',
    name: ''
  };

  viewFields = ['stream', 'state', 'lastTimestampFormatted', 'query'];

  private destroy$ = new Subject();
  private currentTab$: Observable<TabModel>;
  private existingStreams: { key: string[], name: string[] };
  private initial: { key: string, name: string };
  private propsEdited = false;
  infoFormatted$: Observable<ViewInfoFormatted>;
  currentProgress: number = 0;
  currentTaskAborted: boolean = false;
  cancelButtonVisible: boolean = true;
  
  constructor(
    private route: ActivatedRoute,
    private appStore: Store<AppState>,
    private viewsService: ViewsService,
    private globalFiltersService: GlobalFiltersService,
    private symbolsService: SymbolsService,
    private streamsService: StreamsService,
    private fb: FormBuilder,
    private permissionsService: PermissionsService,
    private chartService: ChartService,
    private cdRef: ChangeDetectorRef,
    private structureUpdatesService: StructureUpdatesService
  ) {}

  ngOnInit() {
    this.tabSettings$ = this.appStore.pipe(select(getActiveTabSettings));
    this.notView$ = this.appStore.pipe(select(getActiveTab)).pipe(map(tab => !tab?.isView));
    this.isWriter$ = this.permissionsService.isWriter();
    this.currentTab$ = this.appStore.pipe(select(getActiveOrFirstTab));

    this.streamsService.streamPropsOpened = true;

    this.streamsService
      .getList(false)
      .pipe(takeUntil(this.destroy$))
      .subscribe(streams => {
        this.existingStreams = {
          key: streams.map(stream => stream?.key).filter(key => this.initial?.key && key !== this.initial.key),
          name: streams.map(stream => stream?.name).filter(name => this.initial?.name && name !== this.initial.name)
        };
      });

    this.tabSettings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((settings: TabSettingsModel) => (this.tabSettings = settings));

    const routeParams$ = this.route.params as Observable<{stream: string; symbol: string}>;
    this.isSymbol$ = this.currentTab$.pipe(map((tab) => tab && !!tab.symbol));

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

    this.currentTab$
      .pipe(filter(tab => tab?.isTopic), takeUntil(this.destroy$))
      .subscribe(tab => {
        const topicProps = [
          { key: 'key', value: tab.name },
          { key: 'name', value: tab.name }
        ];
        this.propsSubject.next(topicProps);
      });

    routeParams$.pipe(
      withLatestFrom(this.currentTab$),
      filter(([params, tab]) => !!params.stream && !params.stream.endsWith('#topic#') && !tab?.isTopic),
      switchMap(([params]) => params.symbol
        ? this.symbolsService.getProps(params.stream, params.symbol, null, false)
        : this.streamsService.getProps(params.stream, false)
      ),
      take(1),
      withLatestFrom(this.globalFiltersService.getFilters()),
      takeUntil(this.destroy$)
      )
      .subscribe(([result, filters]) => {
        this.props = this.formatProps(JSON.parse(JSON.stringify(result)).props, filters);
        this.setBackgrountaskProperties();
        this.propsSubject.next(this.props);
        this.periodisityType = result.props.periodicity.type;
        this.initial = {
          key: result.props.key,
          name: result.props.name
        };
        this.form.patchValue({
          key: result.props.key,
          name: result.props.name,
          description: result.props.description,
        });

        if (result.props.periodicity.interval) {
          const [ intervalNumber, timeUnit ] = result.props.periodicity.interval.split(' ') ?? '';
          this.periodicityForm.patchValue({
            type: this.periodisityType.charAt(0) + this.periodisityType.slice(1).toLowerCase(),
            intervalNumber,
            timeUnit: timeUnit.charAt(0) + timeUnit.slice(1).toLowerCase(),
           } );
        } else {
          this.periodicityForm.patchValue({
            type: this.periodisityType.charAt(0) + this.periodisityType.slice(1).toLowerCase(),
            intervalNumber: '',
            timeUnit: '',
           } );
        }
      })

    this.isSymbol$.pipe(
      filter(isSymbol => !!isSymbol),
      switchMap(() => this.propsSubject),
      takeUntil(this.destroy$)
      ).subscribe(props => {
        this.streamProps = props.filter(prop => !prop.key.includes('symbol'));
        this.symbolProps = props.filter(prop => prop.key.includes('symbol'));
      })

    const props$ = 
      this.currentTab$.pipe(
        filter(tab => tab && !tab.isTopic), 
        distinctUntilChanged((t1: TabModel, t2) => t1.id === t2.id),
        switchMap(tab => {
          if (!tab.chart) {
            return routeParams$.pipe(map(params => ({ 
              symbols: params.symbol ? [params.symbol] : [], stream: params.stream })));
          } else {
            return this.chartService.openSymbols$.pipe(
              pluck(tab.id),
              map(list => ({ symbols: list?.length ? list : [tab.symbol], stream: tab.stream })),
            );
          }
        }),
        filter(params => !!params.stream && !params.stream.endsWith('#topic#')),
        switchMap((params) => {
          return params.symbols.length ? 
            forkJoin(params.symbols.map(symbol => this.symbolsService.getProps(params.stream, symbol)))
              .pipe(
                map(propList => {
                  const reducedProps = propList.reduce((acc, { props }, i) => {
                    if (!Object.keys(acc).length) {
                      return props;
                    } else {
                      const symbolProps = Object.fromEntries(Object.entries(props)
                        .filter(([key]) => key.startsWith('symbol'))
                        .map(([key, value]) => [`${key}_${i}`, value]));
                    
                      return { ...acc, ...symbolProps };
                    }
                  }, {});
                  return { props: reducedProps };
              }))
            : this.streamsService.getProps(params.stream);
          }
        ),
        shareReplay(1),
      );

    const props = combineLatest([this.globalFiltersService.getFilters(), props$]).pipe(
      distinctUntilChanged(equal),
      filter(([, props]) => !!props),
      map(([filters, props]: [GlobalFilters, fromStreamProps.State]) => {
        return this.formatProps(JSON.parse(JSON.stringify(props)).props, filters);
      }),
    );

    this.structureUpdatesService.onStreamUpdates()
      .pipe(
        filter(event => event.changed?.[0] === this.streamId && event.deleted?.[0] !== this.streamId),
        switchMap(() => this.structureUpdatesService.getBackgroundTask(this.streamId)),
        withLatestFrom(this.globalFiltersService.getFilters()),
      )
      .subscribe(([info, filters]) => {
        this.setBackgrountaskProperties(info, filters);
        this.propsSubject.next(this.props);
        this.cdRef.markForCheck();
        this.backGroundTaskProgress();
    });

    props.pipe(
      tap(props => {
        this.streamId = props.find(item => ['streamKey', 'key'].includes(item.key))?.value;
        this.backGroundTaskProgress();
        if (!this.streamId) {
          this.errorMessages = null;
        }
        this.props = props;
        this.setBackgrountaskProperties();
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
      this.updateValidationErrors('periodicity', '');
      this.updateValidationErrors('time_unit', '');
      this.periodisityType = value?.toUpperCase();
      if (!['REGULAR', 'IRREGULAR', 'STATIC'].includes(this.periodisityType)) {
        this.updateValidationErrors('periodicity', "type must be 'Regular', 'Irregular' or 'Static'");
      }
    });

    this.periodicityForm.get('intervalNumber').valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.updateValidationErrors('periodicity', '');
        if (value === null) {
          this.updateValidationErrors('periodicity', 'interval is required');
        } else if (value !== null && value < 1) {
          this.updateValidationErrors('periodicity', 'interval cannot be less than 1');
        } else if (value !== null && value % 1) {
          this.updateValidationErrors('periodicity', 'interval must be an integer');
        } else if (value !== null && value > 10000) {
          this.updateValidationErrors('periodicity', 'number in interval must be less than or equal to 10.000');
        }
        if (this.periodisityType !== 'REGULAR') {
          this.updateValidationErrors('periodicity', '');
        }
      });

    this.periodicityForm.get('timeUnit').valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.updateValidationErrors('time_unit', '');
        if (!value) {
          this.updateValidationErrors('time_unit', 'is required');
        }
        if (this.periodisityType !== 'REGULAR') {
          this.updateValidationErrors('time_unit', '');
        }
      });

    ['name', 'key'].forEach(key => {
      this.form.get(key).valueChanges
        .pipe(takeUntil(this.destroy$), withLatestFrom(this.isSymbol$), filter(() => this.propsEdited))
        .subscribe(([value, isSymbol]) => {
          if (value?.length > 255) {
            this.updateValidationErrors(key, `must be up to 255 characters long`);  
          } else if (key === 'key' && forbiddenChars.some(char => value?.includes(char))) {
            this.updateValidationErrors(key, `includes forbidden characters ( ${forbiddenCharsForMessage.join(' ')} )`);
          } else if (this.existingStreams?.[key].includes(value)) {
            this.updateValidationErrors(key, `stream with this ${key} already exists`);   
          } else if (!isSymbol) {
            if (!this.errorMessages?.[key]?.includes('alphanumeric')) {
              this.updateValidationErrors(key, '');  
            }
            this.streamsService.validateStreamName(value)
              .pipe(take(1), takeUntil(this.destroy$))
              .subscribe(isValid => {
                if (!isValid) {
                  this.updateValidationErrors(key, `must contain at least one alphanumeric character`);
                } else if (this.errorMessages?.[key]?.includes('alphanumeric')) {
                  this.updateValidationErrors(key, '');  
                }
                this.cdRef.markForCheck();
              })
          }
        })
    })

    const info$ = this.appStore.pipe(
      select(getActiveTab),
      filter(t => !!t),
      distinctUntilChanged((t1, t2) => t1.id === t2.id),
      switchMap(tab => this.viewsService.get(tab.name)),
    );

    this.infoFormatted$ = combineLatest([
      info$,
      this.globalFiltersService.getFilters(),
    ]).pipe(map(([info, filters]) => {
      return {
        ...info,
        lastTimestampFormatted: info?.lastTimestamp > 0 ? formatHDate(
          new Date(info.lastTimestamp).toISOString(),
          filters.dateFormat,
          filters.timeFormat,
          filters.timezone,
        ) : null,
      };
    }));
  }

  ngOnDestroy(): void {
    this.streamsService.streamPropsOpened = false;
    this.appStore.dispatch(new StreamPropsActions.StopSubscriptions());
  }

  stopBackgroudTask() {
    this.cancelButtonVisible = false;
    this.structureUpdatesService.abortBackgroundTask(this.streamId)
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(() => this.currentTaskAborted = true);
  }

  private backGroundTaskProgress() {
    this.structureUpdatesService.getBackgroundTask(this.streamId).pipe(
      take(1),
      withLatestFrom(this.globalFiltersService.getFilters()),
    ).subscribe(([info, filters]) => {
      let ratio = 1;
      const progressDiff = (info.progress - this.currentProgress) * 100;
      if (progressDiff < 1) {
        ratio = Math.ceil(1 / progressDiff);
      }
      this.currentProgress = info.progress;
      this.currentTaskAborted = info.status === 'Aborted';
      this.setBackgrountaskProperties(info, filters);
      this.propsSubject.next([...this.props]);
      this.cdRef.detectChanges();
      if (info.progress < 1 && info.name) {
        setTimeout(() => {
          if (!this.currentTaskAborted) {
            this.backGroundTaskProgress();
          }
        }, 1000 * ratio);
      }
    })
  }

  private updateValidationErrors(key: string, value: string) {
    this.errorMessages = {
      ...this.errorMessages,
      [key]: value
    };
    this.cdRef.markForCheck();
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
    this.propsEdited = true;
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

  private setBackgrountaskProperties(taskProperties: object = null, filters = null) {
    const formattedProps = this.formatProps(JSON.parse(JSON.stringify(taskProperties)), filters);
    const backGrounTaskPropIndex = this.props.findIndex(prop => prop.key === 'backgroundTask');

    if (backGrounTaskPropIndex > -1) {
      const taskName = this.props[backGrounTaskPropIndex].children.find(p => p.key === 'name')?.value;
      if (taskName || formattedProps.length) {
        const formattedChildren = this.formatBackgroundtaskProps(
          formattedProps.length ? formattedProps : this.props[backGrounTaskPropIndex].children);

        this.props.splice(backGrounTaskPropIndex, 1, {
          ...this.props[backGrounTaskPropIndex],
          children: formattedChildren
        });
      } else if (!formattedProps.length) {
        this.props.splice(backGrounTaskPropIndex, 1);
      } else {
        this.props.push({
          key: 'backgroundTask',
          value: null,
          children: this.formatBackgroundtaskProps(formattedProps)
        });
      }
    }
  }

  private formatBackgroundtaskProps(props) {
    return props.map(property => {
      if (['referToStream', 'isFinished'].includes(property.key)) {
        return;
      } else if (property.key === 'name') {
        return { ...property, key: 'taskName' };
      } else if (property.key === 'error' && !property.value) {
        return;
      } else if (property.key === 'endTime' && !+new Date(property.value)) {
        return;
      } else if (property.key === 'progress' && property.value === 1) {
        return;
      } else {
        return property;
      }
    }).filter(prop => !!prop);
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

          this.chartService.updatedPeriodicity[this.streamId] = {
            aggregation: result.periodicity.milliseconds,
            name: result.periodicity.interval.toLowerCase(),
            units: units.toUpperCase(),
            number: +number
          }
        });
      }
    }
  }

  get intervalDigitValue() {
    return this.periodicityForm.get('intervalNumber').value;
  }
}