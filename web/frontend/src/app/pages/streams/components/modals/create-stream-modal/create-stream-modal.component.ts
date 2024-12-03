import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, UntypedFormControl, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {BsModalRef} from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';
import {AppState} from '../../../../../core/store';
import {StreamsService} from '../../../../../shared/services/streams.service';
import {appRoute} from '../../../../../shared/utils/routes.names';
import {uniqueName} from '../../../../../shared/utils/validators';
import * as StreamDetailsActions from '../../../store/stream-details/stream-details.actions';
import { forbiddenChars, forbiddenCharsForMessage } from 'src/app/shared/utils/forbiddenCharacters';
import { TopicService } from '../../../modules/schema-editor/services/topic.service';

@Component({
  selector: 'app-create-stream-modal',
  templateUrl: './create-stream-modal.component.html',
  styleUrls: ['./create-stream-modal.component.scss'],
})
export class CreateStreamModalComponent implements OnInit, OnDestroy {
  streamNameControl: UntypedFormControl;
  copyToStreamControl: UntypedFormControl;
  versionControl: UntypedFormControl;
  distributionFactorControl: UntypedFormControl;
  forbiddenCharsForMessage = forbiddenCharsForMessage;
  lastNameValidationError: {[key: string]: boolean };
  lastStreamValidationError: {[key: string]: boolean };
  topic: boolean;
  versionOptions = [4, 5];
  distributionFactorOptions = ['1', 'MAX'];
  copyToExistingStream: boolean;
  autocomplete$: Observable<string[]>;
  showDistributionFactorInput$ = new BehaviorSubject(false);
  private destroy$ = new Subject();
  private topicStreamName$ = new BehaviorSubject('');

  constructor(
    private appStore: Store<AppState>,
    public bsModalRef: BsModalRef,
    private router: Router,
    private streamsService: StreamsService,
    private topicService: TopicService
  ) {}

  ngOnInit(): void {
    const allStreams$ = this.streamsService.getList(false);

    const existing$ = allStreams$.pipe(map((streams) => streams.map((stream) => stream.key)));
    
    this.streamNameControl = new UntypedFormControl(null, {
      validators: [Validators.required, Validators.maxLength(255), this.noForbiddenSymbols()],
      asyncValidators: [(this.topic ? this.notUniqueTopicName() : uniqueName(existing$)), this.containsAlphaNumericSymbol()],
    });

    this.streamNameControl.statusChanges
      .pipe(filter(status => status !== 'PENDING', takeUntil(this.destroy$)))
      .subscribe(() => this.lastNameValidationError = this.streamNameControl.errors);

    this.copyToStreamControl = new UntypedFormControl(null, {
      validators: [Validators.maxLength(255), this.noForbiddenSymbols()],
      asyncValidators: [this.containsAlphaNumericSymbol()],
    });

    this.versionControl = new UntypedFormControl(5);
    this.distributionFactorControl = new UntypedFormControl('MAX', { validators: this.isIntegerOrMax() });
    
    this.versionControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(version => this.showDistributionFactorInput$.next(version === '4'));

    this.copyToStreamControl.statusChanges
      .pipe(filter(status => status !== 'PENDING', takeUntil(this.destroy$)))
      .subscribe(() => this.lastStreamValidationError = this.streamNameControl.errors);

    if (this.topic) {
      this.autocomplete$ = allStreams$.pipe(map((streams) => streams.map((stream) => stream.name)));

      combineLatest([
        this.autocomplete$,
        this.topicStreamName$,
      ]).pipe(
        map(([streams, stream]) => {
          return streams.includes(stream);
        }),
        takeUntil(this.destroy$)
      ).subscribe(streamInTheList => this.copyToExistingStream = streamInTheList);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  topicStreamNameChange(name: string) {
    this.copyToStreamControl.patchValue(name);
    if (this.copyToStreamControl.pristine) {
      this.copyToStreamControl.markAsDirty();
    };
    this.topicStreamName$.next(name);
  }

  onCreateStream() {
    if (this.streamNameControl.invalid) return;
    this.bsModalRef.hide();
    const distributionFactorValue = this.distributionFactorControl.value;
    const distributionFactor = this.versionControl.value !== '4' ? null :
      distributionFactorValue === 'MAX' ? 0 : +distributionFactorValue;

    if (this.topic) {
      this.topicService.dataForCopyToStream = {
        streamKey: this.topicStreamName$.getValue(),
        copyToExistingStream: this.copyToExistingStream,
        storageVersion: !this.copyToExistingStream ? this.versionControl.value : null,
        distributionFactor
      };
    } else {
      this.streamsService.streamCreationData = {
        storageVersion: this.versionControl.value,
        distributionFactor
      };
    }
    this.router.navigate([appRoute, 'stream', this.topic ? 'topic-create' : 'stream-create', this.streamNameControl.value], {
      queryParams: {newTab: '1'},
    });
    this.appStore.dispatch(new StreamDetailsActions.RemoveErrorMessage());
  }

  private noForbiddenSymbols() {
    return (control: FormControl) => !forbiddenChars.some(char => control.value?.includes(char)) ? 
      null : { forbiddenSymbols: true };
  }

  private containsAlphaNumericSymbol() {
    return (control: UntypedFormControl) => {
      return this.streamsService.validateStreamName(control.value)
        .pipe(map(isValid => isValid ? null : { noAlphaNumeric: true } ));
    }
  }

  private notUniqueTopicName() {
    return (control: UntypedFormControl) => {
      return this.topicService.getTopicList()
        .pipe(map(topicList => !topicList.includes(control.value) ? null : { nameIsForbidden: true } ));
    };
  }

  distributionFactorChange(value: string) {
    this.distributionFactorControl.patchValue(value);
    this.distributionFactorControl.markAsDirty();
  }

  private isIntegerOrMax() {
    return (control: UntypedFormControl) => {
      if (this.versionControl.value !== '4') {
        return null;
      }
      const value = control.value;
      return value === 'MAX' || (value % 1 === 0 && value > 0 && value < 10001) ? null : { invalidValue: true };
    };
  }
}
