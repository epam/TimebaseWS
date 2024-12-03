import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { TimebaseService } from './generate-ddl.service';
import { AppState } from 'src/app/core/store';
import { Store, select } from '@ngrx/store';
import { getActiveTab } from '../streams/store/streams-tabs/streams-tabs.selectors';
import { StreamsService } from 'src/app/shared/services/streams.service';
import { StreamModel } from '../streams/models/stream.model';
import { Router } from '@angular/router';
import { appRoute } from 'src/app/shared/utils/routes.names';

const defaultinputDDL = 
``;


@Component({
  selector: 'app-generate-ddl',
  templateUrl: './generate-ddl.component.html',
  styleUrls: ['./generate-ddl.component.scss'],
})
export class GenerateDDLComponent implements OnInit, OnDestroy  {

  inputDDL: FormControl;
  resultDDL = '';
  resultQQL = '';
  ddlErrorMessage: string | null;
  qqlErrorMessage: string | null;
  isLoading: boolean;
  responceCame: boolean;
  resultDDLNotValid: boolean = false;
  resultQQLNotValid: boolean = false;
  warningMessage: string;
  ddlIsUsing: boolean;
  form: FormGroup;
  streamList: StreamModel[];
  streamNameList: string[];
  selectedStreamList: AbstractControl;
  inputQQL: AbstractControl;
  private destroy$ = new Subject<void>();
  private tabId: string;

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
    if (this.timebaseService.ddlIsUsing) {
      this.toggleDDL();

    }

    this.form = this.fb.group({
      selectedStreams: [[]],
      inputQQL: ''
    });

    this.selectedStreamList = this.form.get('selectedStreams');
    this.inputQQL = this.form.get('inputQQL');

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

    this.inputQQL.valueChanges
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

  toggleDDL() {
    this.ddlIsUsing = !this.ddlIsUsing;
    this.timebaseService.ddlIsUsing = this.ddlIsUsing;
    this.setWarningMessage(this.ddlIsUsing);
  }

  generate() {
    this.responceCame = false;
    if (this.ddlIsUsing) {
      this.ddlErrorMessage = null;
      this.resultDDLNotValid = false;
    } else {
      this.qqlErrorMessage = null;
      this.resultQQLNotValid = false;
    }
    this.resultDDL = '';
    this.isLoading = true;
    this.cdRef.detectChanges();
    if (this.ddlIsUsing) {
      this.inputDDL.disable();
      this.timebaseService.generateDDL(this.inputDDL.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.responceCame = true;
          this.ddlErrorMessage = result.errorMessage;
          this.resultDDLNotValid = result.resultIsNotValid;
          this.setWarningMessage(this.ddlIsUsing);
          this.resultDDL = result.resultDDL;
          this.timebaseService.saveResult(
            `ddl-${this.tabId}`, 
            JSON.stringify([this.inputDDL.value, this.resultDDL, this.ddlErrorMessage, this.resultDDLNotValid]));
          this.inputDDL.enable();
          this.isLoading = false;
          this.cdRef.detectChanges();
        },
        error: () => {
          this.inputDDL.enable();
          this.isLoading = false;
          this.cdRef.detectChanges();
          this.resultDDL = '';
          this.timebaseService.saveResult(`ddl-${this.tabId}`, JSON.stringify([this.inputDDL.value, this.resultDDL]));
        }
      })
    } else {
      this.inputQQL.disable();
      const streams = this.streamList
        .filter(stream => this.selectedStreamList.value.includes(stream.name))
        .map(stream => stream.key);

      this.timebaseService.generateQQL(this.inputQQL.value, streams)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: result => {
            this.responceCame = true;
            this.qqlErrorMessage = result.errorMessage;
            this.resultQQLNotValid = result.resultIsNotValid;
            this.setWarningMessage(this.ddlIsUsing);
            this.resultQQL = result.resultDDL;
            this.timebaseService.saveResult(
              `qql-${this.tabId}`, 
              JSON.stringify([
                this.inputQQL.value, this.resultQQL, 
                this.qqlErrorMessage, this.resultQQLNotValid, this.selectedStreamList.value]));
            this.inputQQL.enable();
            this.isLoading = false;
            this.cdRef.detectChanges();
          },
          error: () => {
            this.inputDDL.enable();
            this.isLoading = false;
            this.cdRef.detectChanges();
            this.resultDDL = '';
            this.timebaseService.saveResult(
              `qql-${this.tabId}`, 
              JSON.stringify([this.inputQQL.value, this.resultQQL, null, null, this.selectedStreamList.value]));
          }
        })
    }
  }

  openQueryEditor(ddl = false) {
    this.timebaseService.currentQuery = ddl ? this.resultDDL : this.resultQQL;
    this.router.navigate([appRoute, 'query']);
  }

  setWarningMessage(ddlIsUsing: boolean) {
    this.warningMessage = `Failed to produce valid ${ddlIsUsing ? 'DDL' : 'QQL'}. 
      ${this.ddlIsUsing ? 'DDL' : 'QQL'} below is provided just for reference and can't be used right away`;
  }

  private applySavedResult() {
    this.appStore.pipe(select(getActiveTab))
      .pipe(
        distinctUntilChanged((tab1, tab2) => tab1?.id === tab2?.id),
        takeUntil(this.destroy$)
      ).subscribe(({ id }) => {
        this.tabId = id;
        const [inputDDL, outputDDL, errorDDL, invalidDDL] = this.timebaseService.getSavedResult(`ddl-${id}`) ?? [null, null];
        this.inputDDL.patchValue(inputDDL ?? defaultinputDDL, { emitEvent: false });
        this.resultDDL = outputDDL;
        this.ddlErrorMessage = errorDDL;
        this.resultDDLNotValid = invalidDDL;

        const [inputQQL, outputQQL, errorQQL, invalidQQL, streams] = this.timebaseService.getSavedResult(`qql-${id}`) ?? [null, null];
        this.inputQQL.patchValue(inputQQL ?? '', { emitEvent: false });
        this.resultQQL = outputQQL;
        this.selectedStreamList.patchValue(streams ?? [], { emitEvent: false });
        this.qqlErrorMessage = errorQQL;
        this.resultQQLNotValid = invalidQQL;

        this.setWarningMessage(this.ddlIsUsing);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
