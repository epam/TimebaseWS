import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { map, takeUntil, take, switchMap, filter, distinctUntilChanged } from 'rxjs/operators';
import { Subject, forkJoin, BehaviorSubject, Observable } from 'rxjs';
import { BsModalRef } from 'ngx-bootstrap/modal';

import * as fromStreams from '../../../store/streams-list/streams.reducer';
import * as fromStreamProps from 'src/app/pages/streams/store/stream-props/stream-props.reducer';
import { StreamsService } from 'src/app/shared/services/streams.service';
import { PlaybackService } from '../../../services/playback.service';
import { StreamModel } from '../../../models/stream.model';
import { TopicService } from '../../../modules/schema-editor/services/topic.service';
import { camelCaseToWords } from 'src/app/shared/utils/camelCaseToWords';
import { KeyValue } from '@angular/common';
import { GlobalFilterTimeZone } from '../../../models/global.filter.model';
import { GlobalFiltersService } from 'src/app/shared/services/global-filters.service';
import { getDefaultTimebase, getTimebases } from '../../../store/timebases/timebases.selectors';
import { TimebaseInstanceDef } from 'src/app/shared/models/timebase-instance-def.model';

@Component({
  selector: 'app-modal-play-back',
  templateUrl: './modal-play-back.component.html',
  styleUrls: ['./modal-play-back.component.scss']
})
export class ModalPlayBackComponent implements OnInit {
  formGroup: FormGroup;
  sourceStreamNameList: string[] = [];
  targetStreamNameList: string[] = [];
  topicNameList: string[] = [];
  timebases$: Observable<TimebaseInstanceDef[]>;
  sourceTbId: string = null;
  targetTbId: string = null;
  private timebasesList: TimebaseInstanceDef[] = [];

  get sourceTbUnavailable(): boolean {
    return this.timebasesList.find((tb) => tb.id === this.sourceTbId)?.connected === false;
  }

  get targetTbUnavailable(): boolean {
    return this.timebasesList.find((tb) => tb.id === this.targetTbId)?.connected === false;
  }
  playbackSpeedOptions = ['1', '2', '5', '10', 'MAX'];
  endTimeMin: Date;
  validationErrorMessages = {
    sourceStream: '',
    targetStream: '',
    startTime: '',
    endTime: '',
    timeRange: '',
    speed: ''
  };
  inputsInvalid = {
    startTime: false,
    endTime: false
  };
  inputsAreDisabled = {
    startTime: true,
    endTime: true
  }
  formInvalid$ = new BehaviorSubject(false);

  private allStreamRanges: { streamName: string, startTime: Date, endTime: Date }[] = [];
  private currentStreamRanges: { streamName: string, startTime: Date, endTime: Date }[];
  private streamList: StreamModel[] = [];
  private targetStreamList: StreamModel[] = [];
  private stream: { id: string, name: string };
  private destroy$ = new Subject();
  private _sourceTbId$ = new BehaviorSubject<string>(null);
  private _targetTbId$ = new BehaviorSubject<string>(null);

  public selectedTimezone$: Observable<GlobalFilterTimeZone>;
  public targetTypeIsTopic: boolean;
  public streamNameControl: AbstractControl;
  public topicNameControl: AbstractControl;
  public speedControl: AbstractControl;

  constructor(
    private fb: FormBuilder, 
    private streamsStore: Store<fromStreams.FeatureState>,
    private streamsService: StreamsService,
    private cdRef: ChangeDetectorRef,
    private playbackService: PlaybackService,
    private bsModalRef: BsModalRef,
    private topicServics: TopicService,
    private globalFiltersService: GlobalFiltersService) { }

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      sourceStreams: [[this.stream.name]],
      targetType: 'stream',
      targetStream: '',
      targetTopic: '',
      speed: '1',
      speedChange: true,
      cyclic: false,
      permanent: false,
      startTime: null,
      endTime: null
    });

    this.selectedTimezone$ = this.globalFiltersService.getFilters().pipe(map(filters => filters.timezone[0]), takeUntil(this.destroy$));

    this.timebases$ = this.streamsStore.pipe(select(getTimebases));
    this.timebases$.pipe(takeUntil(this.destroy$)).subscribe((timebases) => {
      this.timebasesList = timebases || [];
    });

    // Load stream lists when source/target TB changes
    this._sourceTbId$.pipe(
      filter(tbId => tbId != null),
      distinctUntilChanged(),
      switchMap(tbId => this.streamsService.getList(false, null, null, tbId)),
      takeUntil(this.destroy$)
    ).subscribe(streams => {
      this.streamList = streams;
      this.sourceStreamNameList = streams.map(s => s.name).filter(n => !!n.trim());
      this.allStreamRanges = [];
      const name = streams.find(s => s.key === this.stream.id)?.name ?? this.stream.name;
      this.formGroup.patchValue({ sourceStreams: name ? [name] : [] });
    });

    this._targetTbId$.pipe(
      filter(tbId => tbId != null),
      distinctUntilChanged(),
      switchMap(tbId => this.streamsService.getList(false, null, null, tbId)),
      takeUntil(this.destroy$)
    ).subscribe(streams => {
      this.targetStreamList = streams;
      this.targetStreamNameList = streams.map(s => s.name).filter(n => !!n.trim());
    });

    // Resolve default TB and trigger initial stream loading
    this.streamsStore.pipe(select(getDefaultTimebase), take(1)).subscribe(defaultTb => {
      const defaultId = defaultTb?.id ?? null;
      if (!this.sourceTbId) { this.sourceTbId = defaultId; }
      if (!this.targetTbId) { this.targetTbId = defaultId; }
      this._sourceTbId$.next(this.sourceTbId);
      this._targetTbId$.next(this.targetTbId);
    });

    this.topicServics.getTopicList()
      .pipe(takeUntil(this.destroy$))
      .subscribe((topicList: string[]) => this.topicNameList = topicList);

    this.formGroup.get('startTime').valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.onTimeChange(value, 'startTime'));

    this.formGroup.get('endTime').valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.onTimeChange(value, 'endTime'));

    this.speedControl = this.formGroup.get('speed');

    this.formGroup.get('speedChange').valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(checked => {
        if (checked) {
          this.speedControl.enable();
        } else {
          this.speedControl.patchValue(1);
          this.speedControl.disable();
        }
      });

    this.formGroup.get('sourceStreams').valueChanges
      .pipe(
        switchMap(sourceStreamNames => {

          this.validationErrorMessages = {
            ...this.validationErrorMessages, 
            sourceStream: !sourceStreamNames.length ? 'Source Stream is Required' : ''
          };
          this.updateButtonDisabledProp();

          this.currentStreamRanges = this.allStreamRanges?.filter(streamRange => sourceStreamNames.includes(streamRange.streamName));
          const streamPropsObservables = [];
          for (let streamName of sourceStreamNames) {
            if (!this.allStreamRanges.find(item => item.streamName === streamName)) {
              const streamId = this.streamList.find(stream => stream.name === streamName).key;
              streamPropsObservables.push(
                this.streamsService.getProps(streamId, true, this.sourceTbId)
                  .pipe(take(1),
                    map((response: fromStreamProps.State) => [streamName, response.props.range.start, response.props.range.end]),
                  )
                )
            }
          }
          return forkJoin(streamPropsObservables);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((namesAndTimeranges: Array<[string, Date, Date]>) => {
        for (let streamInfo of namesAndTimeranges) {
          const [streamName, startTime, endTime] = streamInfo;
          this.allStreamRanges.push( { streamName, startTime, endTime } );
          this.currentStreamRanges.push( { streamName, startTime, endTime } );
        }

        this.formGroup.patchValue({
          startTime: new Date(Math.min(...this.currentStreamRanges.map(range => new Date(range.startTime).getTime()))), 
          endTime: new Date(Math.max(...this.currentStreamRanges.map(range => new Date(range.endTime).getTime())))
        });

        this.inputsInvalid = { startTime: false, endTime: false };
        this.validationErrorMessages = { ...this.validationErrorMessages, timeRange: '' };
        this.updateButtonDisabledProp();
        this.cdRef.detectChanges();
      })

    this.streamNameControl = this.formGroup.get('targetStream');
    this.topicNameControl = this.formGroup.get('targetTopic');
    this.topicNameControl.disable();
    this.targetTypeIsTopic = false;

    this.formGroup.get('targetType').valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.targetTypeIsTopic = value === 'topic';
        if (!this.targetTypeIsTopic) {
          this.topicNameControl.disable();
          this.streamNameControl.enable();
        } else {
          this.topicNameControl.enable();
          this.streamNameControl.disable();
        }
        this.validationErrorMessages = {
          ...this.validationErrorMessages, 
          targetStream: ''
        };
      });
  }

  onSourceTbChange(tbId: string) {
    this.sourceTbId = tbId;
    this._sourceTbId$.next(tbId);
  }

  onTargetTbChange(tbId: string) {
    this.targetTbId = tbId;
    this._targetTbId$.next(tbId);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  updateButtonDisabledProp() {
    this.formInvalid$.next(Object.values(this.validationErrorMessages).some(mes => mes !== ''));
  }

  setTarget(name: string) {
    this.formGroup.get('targetType').patchValue(name);
  }

  createPlayback() {
    const speedValue = this.formGroup.get('speed').value;
    const isTopic = this.formGroup.get('targetType').value === 'topic';
    const sourceStreams = this.formGroup.value.sourceStreams.map((streamName: string) => {
      return this.streamList.find(stream => stream.name === streamName).key;
    });
    const targetLookupList = this.targetStreamList.length ? this.targetStreamList : this.streamList;
    const targetStream = isTopic ? this.formGroup.value.targetTopic :
      (targetLookupList.find(stream => stream.name === this.formGroup.value.targetStream)?.key ??
      this.formGroup.value.targetStream);

    const params = { ...this.formGroup.value };
    delete params.startTime;
    delete params.endTime;
    delete params.targetType;

    this.playbackService.createPlayback({
      ...params,
      sourceStreams,
      targetStream,
      speed: speedValue === 'MAX' ? Number.MAX_SAFE_INTEGER : parseFloat(speedValue),
      from: this.inputsAreDisabled.startTime ? null : this.formGroup.get('startTime').value,
      to: this.inputsAreDisabled.endTime ? null : this.formGroup.get('endTime').value,
      targetTopic: isTopic,
      sourceTb: this.sourceTbId,
      targetTb: this.targetTbId,
    }).subscribe((id: number) => {
        this.playbackService.speedValues[id] = speedValue === 'MAX' ? 'MAX' : `${speedValue}x`;
        this.playbackService.permanenceValues[id] = this.formGroup.get('permanent').value;
        this.playbackService.playbackControlActivated.next(id);
        this.bsModalRef.hide();
        this.playbackService.playbackProgress(id);
      });
  }

  onTargetStreamChanged(targetStream: string, isTopic = false) {
    this.formGroup.get(isTopic ? 'targetTopic' : 'targetStream').patchValue(targetStream);
    let errorText = '';
    if (!targetStream.trim()) {
      if (this.targetTypeIsTopic && isTopic) {
        errorText = 'Target Topic is Required';
      } else if (!this.targetTypeIsTopic && !isTopic) {
        errorText = 'Target Stream is Required';
      }
    }
   
    this.validationErrorMessages = {
      ...this.validationErrorMessages, 
      targetStream: errorText
    };
    this.updateButtonDisabledProp();
  }

  onSpeedChanged(speed: string) {
    let speedValidationErrorText = '';
    this.formGroup.patchValue({speed});
    if (isNaN(+speed) && speed !== 'MAX') {
      speedValidationErrorText = 'Invalid Playback Speed value';
    } else if (!speed) {
      speedValidationErrorText = 'Playback Speed is required';
    } else if (+speed <= 0) {
      speedValidationErrorText = 'Playback Speed must be greater than zero';
    } else if (+speed >= 1e6) {
      speedValidationErrorText = 'Playback Speed must be less than 1 million';
    } else if (speed?.split('.')[1]?.length > 2) {
      speedValidationErrorText = 'Playback Speed value can contain no more than two decimal places';
    }
    this.validationErrorMessages = {
      ...this.validationErrorMessages, 
      speed: speedValidationErrorText
    };
    this.updateButtonDisabledProp();
  }

  toggleInputDisabled(formControlName: string, event) {
    this.inputsAreDisabled[formControlName] = !event.target.checked;

    if (!event.target.checked) {
      this.inputsInvalid[formControlName] = false;
      this.validationErrorMessages[formControlName] = '';
    } else {
      this.validateDate(this.formGroup.get(formControlName).value, formControlName);
    }
    
    this.validateTimeRange();
  }

  onTimeChange(value: Date, startOrEnd: string) {
    if (startOrEnd === 'startTime') {
      this.endTimeMin = new Date(this.formGroup.get('startTime').value);
    }

    this.validateDate(value, startOrEnd);
    this.validateTimeRange();
  }

  private validateTimeRange() {
    const allControlsAreEnabled = !this.inputsAreDisabled.startTime && !this.inputsAreDisabled.endTime;
    const timeRangeInvalid = new Date(this.formGroup.get('startTime').value) > new Date(this.formGroup.get('endTime').value) 
      && allControlsAreEnabled;
    if (timeRangeInvalid) {
      this.inputsInvalid = {
        startTime: true,
        endTime: true
      };
    } else {
      ['startTime', 'endTime'].forEach(control => {
        this.validateDate(this.formGroup.get(control).value, control)
      });
    }

    this.validationErrorMessages = {
      ...this.validationErrorMessages, 
      timeRange: timeRangeInvalid ? 'End Time should be greater than Start Time' : ''
    };
    this.updateButtonDisabledProp();
  }

  private validateDate(controlValue: Date, controlName: string) {
    if ((!controlValue || controlValue?.toString() === 'Invalid Date') && !this.inputsAreDisabled[controlName]) {
      this.validationErrorMessages = {
        ...this.validationErrorMessages,
        [controlName]: `${camelCaseToWords(controlName)} is invalid`
      };
      this.inputsInvalid[controlName] = true;
    } else {
      this.validationErrorMessages = {
        ...this.validationErrorMessages,
        [controlName]: ''
      };
      this.inputsInvalid[controlName] = false;
    }
  }

  originalOrder = (a: KeyValue<number,string>, b: KeyValue<number,string>) => {
    return 0;
  }
}
