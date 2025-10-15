import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { TimebaseService } from './generate-ddl.service';
import { AppState } from 'src/app/core/store';
import { Store, select } from '@ngrx/store';
import { getActiveTab } from '../streams/store/streams-tabs/streams-tabs.selectors';
import { StreamsService } from 'src/app/shared/services/streams.service';
import { StreamModel } from '../streams/models/stream.model';
import { Router } from '@angular/router';
import { appRoute } from 'src/app/shared/utils/routes.names';

const generationStatuses = {
  PLANNING_START: "Starting to plan the response",
  PLANning_DONE: "Planning complete",
  TAGS: "System processing/Configuration check",
  PLANNING_FAILED: "Planning failed",
  DOCS_RETRIEVED: "Information found",
  ERROR: "An error occurred",
  ATTEMPT_START: "Starting response generation",
  PART: "Generating response",
  ATTEMPT_COMPILE_OK: "Response successfully compiled",
  FINAL_SUCCESS: "Response ready",
  ATTEMPT_COMPILE_ERROR: "Error during compilation",
  FINAL_FAILURE: "Generation failed",
  CANCELLED: "Canceled"
} as const;

@Component({
  selector: 'app-generate-ddl',
  templateUrl: './generate-ddl.component.html',
  styleUrls: ['./generate-ddl.component.scss'],
  standalone: false
})
export class GenerateDDLComponent implements OnInit, OnDestroy  {
  inputDDL: FormControl;
  resultStatus: typeof generationStatuses[keyof typeof generationStatuses];
  resultQuery = '';
  ddlErrorMessage: string | null;
  qqlErrorMessage: string | null;
  isLoading: boolean;
  responceCame: boolean;
  warningMessage: string;
  form: FormGroup;
  streamList: StreamModel[];
  streamNameList: string[];
  selectedStreamList: AbstractControl;
  inputQuery: AbstractControl;
  private destroy$ = new Subject<void>();
  private tabId: string;
  private querySubscription: Subscription;

  constructor(
    private timebaseService: TimebaseService, 
    private cdRef: ChangeDetectorRef, 
    private appStore: Store<AppState>,
    private fb: FormBuilder,
    private streamsService: StreamsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.inputDDL = new FormControl(null);

    this.form = this.fb.group({
      selectedStreams: [[]],
      inputQuery: ''
    });

    this.selectedStreamList = this.form.get('selectedStreams');
    this.inputQuery = this.form.get('inputQuery');

    this.streamsService.getList(false)
      .pipe(
        tap(streams => this.streamList = streams ?? []),
        map(streams => streams.map(stream => stream.name) ?? []),
        takeUntil(this.destroy$)
      )
      .subscribe(streamNameList => this.streamNameList = streamNameList.filter(name => !!name.trim()));

    this.applySavedResult();

    this.inputDDL.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const [, output, error, warning] = this.timebaseService.getSavedResult(`ddl-${this.tabId}`) ?? [null, null];
        this.timebaseService.saveResult(`ddl-${this.tabId}`, JSON.stringify([value, output, error, warning]));
    });

    this.inputQuery.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => {
        const [, output, error, warning, streams] = this.timebaseService.getSavedResult(`qql-${this.tabId}`) ?? [null, null];
        this.timebaseService.saveResult(`qql-${this.tabId}`, JSON.stringify([value, output, error, warning, streams]));
    });

    this.selectedStreamList.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(streams => {
        const [input, output, error, warning] = this.timebaseService.getSavedResult(`qql-${this.tabId}`) ?? [null, null];
        this.timebaseService.saveResult(
          `qql-${this.tabId}`, JSON.stringify([input, output, error, warning, streams]));
    });
  }

  generate() {
    this.responceCame = false;
    this.resultQuery = '';

    this.qqlErrorMessage = null;
    this.isLoading = true;
    this.cdRef.detectChanges();
    this.inputQuery.disable();
    this.resultStatus = null;
    const streams = (this.streamList ?? [])
      .filter(stream => this.selectedStreamList.value.includes(stream.name))
      .map(stream => stream.key);

    this.querySubscription = this.timebaseService.generateQQL(this.inputQuery.value, streams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.responceCame = !!result.finalEvent;
          this.qqlErrorMessage = result.error;
          if (!this.responceCame) {
            this.resultStatus = generationStatuses[result.stage];
          }

          if (result.stage === 'PART') {
            this.resultQuery += result.data;
          } else if (result.stage === 'FINAL_SUCCESS') {
            this.resultQuery = result.data;
          } else if (result.stage === 'ATTEMPT_START') {
            this.resultQuery = '';
          }

          this.timebaseService.saveResult(
            `qql-${this.tabId}`, 
            JSON.stringify([
              this.inputQuery.value, this.resultQuery, 
              this.qqlErrorMessage, this.selectedStreamList.value]));

          if (this.responceCame) {
            this.responseCompleted();
          }

          this.cdRef.detectChanges();
        },
        error: () => {
          this.inputQuery.enable();
          this.isLoading = false;
          this.cdRef.detectChanges();
          this.resultQuery = '';
          this.timebaseService.saveResult(
            `qql-${this.tabId}`, 
            JSON.stringify([this.inputQuery.value, this.resultQuery, null, null, this.selectedStreamList.value]));
        }
      });
  }

  private responseCompleted() {
    this.resultStatus = null;
    this.inputQuery.enable();
    this.isLoading = false;
    this.querySubscription.unsubscribe();

    this.timebaseService.saveResult(
      `qql-${this.tabId}`, 
      JSON.stringify([
        this.inputQuery.value, this.resultQuery, 
        this.qqlErrorMessage, this.selectedStreamList.value]));
  }

  stopGeneration() {
    this.resultQuery = '';
    this.qqlErrorMessage = '';
    this.responseCompleted();
  }

  openQueryEditor() {
    this.timebaseService.currentQuery = this.resultQuery;
    this.router.navigate([appRoute, 'query']);
  }

  setWarningMessage() {
    this.warningMessage = `Failed to produce valid query. 
      The query below is provided just for reference and can't be used right away`;
  }

  private applySavedResult() {
    this.appStore.pipe(select(getActiveTab))
      .pipe(
        distinctUntilChanged((tab1, tab2) => tab1?.id === tab2?.id),
        takeUntil(this.destroy$)
      ).subscribe(({ id }) => {
        this.tabId = id;
        const [inputQuery, output, error, streams] = this.timebaseService.getSavedResult(`qql-${id}`) ?? [null, null];
        this.inputQuery.patchValue(inputQuery ?? '', { emitEvent: false });
        this.resultQuery = output;
        this.selectedStreamList.patchValue(streams ?? [], { emitEvent: false });
        this.qqlErrorMessage = error;

        this.setWarningMessage();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
