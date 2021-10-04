import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
}                                                                  from '@angular/core';
import { ActivatedRoute, Data }                                    from '@angular/router';
import { Observable, Subject }                                     from 'rxjs';
import { select, Store }                                           from '@ngrx/store';
import { distinctUntilChanged, filter, takeUntil, withLatestFrom } from 'rxjs/operators';
import { TabSettingsModel }                                        from '../../models/tab.settings.model';
import * as fromStreamProps                                        from '../../store/stream-props/stream-props.reducer';
import * as fromStreamSchema
                                                                   from '../../store/stream-schema/stream-schema.reducer';
import * as fromStreamsSchema
                                                                   from '../../store/stream-schema/stream-schema.reducer';
import * as StreamPropsActions                                     from '../../store/stream-props/stream-props.actions';
import * as fromStreams                                            from '../../store/streams-list/streams.reducer';
import { AppState }                   from '../../../../core/store';
import { streamsSchemaStateSelector } from '../../store/stream-schema/stream-schema.selectors';
import * as StreamSchemaActions
                                      from '../../store/stream-schema/stream-schema.actions';
import { formatHDate }                from '../../../../shared/locale.timezone';
import {
  getStreamGlobalFilters,
  streamsDetailsStateSelector,
}                                     from '../../store/stream-details/stream-details.selectors';
import * as fromStreamDetails
                                      from '../../store/stream-details/stream-details.reducer';
import { getActiveTabSettings }       from '../../store/streams-tabs/streams-tabs.selectors';

export interface KeyValue<K, V> {
  key: K;
  value: V;
}

@Component({
  selector: 'app-streams-props',
  templateUrl: './streams-props.component.html',
  styleUrls: ['./streams-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamsPropsComponent implements OnInit, OnDestroy {
  public closedProps: boolean;
  public propsPublic;
  public propsState: Observable<fromStreamProps.State>;
  @Output() closedPropsEmit = new EventEmitter<boolean>();
  public streamSchema: Observable<fromStreamSchema.State>;
  private destroy$ = new Subject();
  public selectedRowSchemaFields = [];
  public entArr = [];
  public isSchema: boolean;
  public selectedRowIsEnum: boolean;
  public rowTitle = '';
  public streamDetails: Observable<fromStreamDetails.State>;
  private filter_date_format = [];
  private filter_time_format = [];
  private filter_timezone = [];

  public tabSettings$: Observable<TabSettingsModel>;
  public tabSettings: TabSettingsModel = {};

  constructor(
    private route: ActivatedRoute,
    // private router: Router,
    private appStore: Store<AppState>,
    private streamsStore: Store<fromStreams.FeatureState>,
    private streamPropsStore: Store<fromStreamProps.FeatureState>,
    private streamSchemaStore: Store<fromStreamSchema.FeatureState>,
    private cdr: ChangeDetectorRef,
    private streamsSchemaStore: Store<fromStreamsSchema.FeatureState>,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
  ) { }

  ngOnInit() {
    // this.appStore
    //   .pipe(
    //     select(getTabsState),
    //     filter(state => !!state.tabs),
    //     take(1),
    //   )
    //   .subscribe(() => {
    //     this.route.params
    //       .pipe(takeUntil(this.destroy$))
    //       .subscribe((params: { stream: string, symbol?: string }) => {
    //         if (!params.stream) return;
    //         const tab: TabModel = new TabModel({
    //           key: params.symbol || params.stream,
    //           active: true,
    //         });
    //         if (params.symbol) tab.parent = params.stream;
    //         this.streamsStore.dispatch(new StreamsTabsActions.AddTab({
    //           tab: tab,
    //         }));
    //       });
    //   });

    this.tabSettings$ = this.appStore
      .pipe(
        select(getActiveTabSettings),
      );

    this.tabSettings$
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe((settings: TabSettingsModel) => this.tabSettings = settings);

    this.streamSchema = this.streamSchemaStore.pipe(select(streamsSchemaStateSelector));
    this.route.params
      .pipe(
        withLatestFrom(this.route.data),
        takeUntil(this.destroy$),
      )
      .subscribe(([params, data]: [{ stream: string, symbol?: string }, Data]) => {
          this.isSchema = data.hasOwnProperty('schema');
          this.streamsSchemaStore.dispatch(new StreamSchemaActions.ClearSchemaFields());

          this.streamSchema
            .pipe(
              takeUntil(this.destroy$),
            )
            .subscribe((action => {
                this.rowTitle = action.selectedRowName;
                this.selectedRowIsEnum = action.selectedRowIsEnum;
                if (action.selectedRowFields && action.selectedRowFields.length) {
                  this.selectedRowSchemaFields = [...action.selectedRowFields];
                  /*const entries = this.selectedRowSchemaFields.find(a => String(a.type).indexOf('ARRAY') > -1);

                   const subArr = this.selectedRowSchemaFields.filter(a => String(a.type).indexOf('ARRAY') > -1);*/
                  if (this.selectedRowSchemaFields && this.selectedRowSchemaFields.length) {
                    for (const item of this.selectedRowSchemaFields) {
                      if (String(item.type).indexOf('ARRAY') > -1) {
                        const str = item.type.replace('ARRAY[OBJECT[', '').replace(']]', '');
                        item.type = str.split(',');
                      }

                    }
                  }

                } else {
                  this.selectedRowSchemaFields = [];
                }
                if (this.isSchema) {
                  this.cdr.markForCheck();
                }
              }),
            );
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
      .subscribe((action => {
          if (action.filter_date_format && action.filter_date_format.length) {
            this.filter_date_format = [...action.filter_date_format];
          } else {
            this.filter_date_format = [];
          }
          if (action.filter_time_format && action.filter_time_format.length) {
            this.filter_time_format = [...action.filter_time_format];
          } else {
            this.filter_time_format = [];
          }
          if (action.filter_timezone && action.filter_timezone.length) {
            this.filter_timezone = [...action.filter_timezone];
          } else {
            this.filter_timezone = [];
          }
        }
      ));

    this.propsState = this.streamPropsStore.pipe(select('streamProps'));
    this.propsState
      .pipe(
        // select('streamProps'),
        // map((state: fromStreamProps.State) => state.props),
        filter(props => !!props),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(props => {
        this.propsPublic = JSON.parse(JSON.stringify(props));
        if (props && props.props && props.props.range && props.props.range.start && props.props.range.end) {

          this.propsPublic.props.range.start = formatHDate(this.propsPublic.props.range.start, this.filter_date_format, this.filter_time_format, this.filter_timezone);
          this.propsPublic.props.range.end = formatHDate(this.propsPublic.props.range.end, this.filter_date_format, this.filter_time_format, this.filter_timezone);
        }

        // if (props.opened) {
        //   this.closedProps = false;
        // } else {
        //   this.closedProps = true;
        // }
        // this.closedPropsEmit.emit(this.closedProps);
      });

    this.streamsStore.dispatch(new StreamPropsActions.GetProps());
  }

  closeProps() {
    // this.closedProps = true;
    this.closedPropsEmit.emit(this.closedProps);
    // this.appStore.dispatch(new StreamPropsActions.ChangeStateProps({
    //   opened: !this.closedProps,
    // }));
  }

  symbolsTrack(index, props) {
    return props.name; // or item.id
  }

  keyDescOrder = (a: KeyValue<number, string>, b: KeyValue<number, string>): number => {
    return a.key > b.key ? -1 : (b.key > a.key ? 1 : 0);
  }

  isArray(obj: any) {
    return Array.isArray(obj);
  }

  ngOnDestroy(): void {
    this.appStore.dispatch(new StreamPropsActions.ClearProps());
    this.appStore.dispatch(new StreamPropsActions.StopSubscriptions());
  }

}
