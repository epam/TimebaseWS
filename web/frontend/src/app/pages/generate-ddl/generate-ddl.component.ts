import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, take, takeUntil, tap } from 'rxjs/operators';
import { GenerateQueryService } from './generate-ddl.service';
import { AppState } from 'src/app/core/store';
import { Store, select } from '@ngrx/store';
import { getActiveTab, getActiveTabSettings } from '../streams/store/streams-tabs/streams-tabs.selectors';
import { StreamsService } from 'src/app/shared/services/streams.service';
import { StreamModel } from '../streams/models/stream.model';
import { Router } from '@angular/router';
import { appRoute } from 'src/app/shared/utils/routes.names';
import { generationStatuses } from './types';
import { SetTabSettings } from '../streams/store/streams-tabs/streams-tabs.actions';
import { TabModel } from '../streams/models/tab.model';

@Component({
    selector: 'app-generate-ddl',
    templateUrl: './generate-ddl.component.html',
    styleUrls: ['./generate-ddl.component.scss'],
    standalone: false
})
export class GenerateDDLComponent implements OnInit, OnDestroy {
    inputDDL: FormControl;
    resultStatus: typeof generationStatuses[keyof typeof generationStatuses];
    generationStatuses: typeof generationStatuses[keyof typeof generationStatuses][] = [];
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
        private generateQueryService: GenerateQueryService,
        private cdRef: ChangeDetectorRef,
        private appStore: Store<AppState>,
        private fb: FormBuilder,
        private streamsService: StreamsService,
        private router: Router
    ) { }

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
                const [, output, error, warning] = this.generateQueryService.getSavedResult(`ddl-${this.tabId}`) ?? [null, null];
                this.generateQueryService.saveResult(`ddl-${this.tabId}`, JSON.stringify([value, output, error, warning]));
            });

        this.inputQuery.valueChanges
            .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe(value => {
                const [, output, error, warning, streams] = this.generateQueryService.getSavedResult(`qql-${this.tabId}`) ?? [null, null];
                this.generateQueryService.saveResult(`qql-${this.tabId}`, JSON.stringify([value, output, error, warning, streams]));
            });

        this.selectedStreamList.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(streams => {
                const [input, output, error, warning] = this.generateQueryService.getSavedResult(`qql-${this.tabId}`) ?? [null, null];
                this.generateQueryService.saveResult(
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
        this.updateTabSettings(true);
        this.generationStatuses = [];
        const streams = (this.streamList ?? [])
            .filter(stream => this.selectedStreamList.value.includes(stream.name))
            .map(stream => stream.key);

        this.querySubscription = this.generateQueryService.generateQQL(this.inputQuery.value, streams)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: result => {
                    this.responceCame = !!result.finalEvent;
                    this.qqlErrorMessage = result.error;
                    if (!this.responceCame) {
                        const newStatus = !this.generationStatuses.includes(this.resultStatus) && generationStatuses[result.stage] !== this.resultStatus;
                        if (this.resultStatus && newStatus) {
                            this.generationStatuses.unshift(this.resultStatus);
                        }
                        this.resultStatus = generationStatuses[result.stage];
                    }

                    if (result.stage === 'PART') {
                        this.resultQuery += result.data;
                    } else if (result.stage === 'FINAL_SUCCESS') {
                        this.resultQuery = result.data;
                    } else if (result.stage === 'ATTEMPT_START') {
                        this.resultQuery = '';
                    }

                    this.generateQueryService.saveResult(
                        `qql-${this.tabId}`,
                        JSON.stringify([
                            this.inputQuery.value, this.resultQuery,
                            this.qqlErrorMessage, this.selectedStreamList.value]));

                    if (this.responceCame) {
                        this.updateTabSettings(false);
                        this.responseCompleted();
                    }

                    this.cdRef.detectChanges();
                },
                error: () => {
                    this.inputQuery.enable();
                    this.isLoading = false;
                    this.cdRef.detectChanges();
                    this.resultQuery = '';
                    this.generateQueryService.saveResult(
                        `qql-${this.tabId}`,
                        JSON.stringify([this.inputQuery.value, this.resultQuery, null, null, this.selectedStreamList.value]));
                    this.updateTabSettings(false);
                }
            });
    }

    private responseCompleted() {
        this.resultStatus = null;
        this.generationStatuses = [];
        this.inputQuery.enable();
        this.isLoading = false;
        this.querySubscription.unsubscribe();

        this.generateQueryService.saveResult(
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
        this.generateQueryService.currentQuery = this.resultQuery;
        this.router.navigate([appRoute, 'query']);
    }

    setWarningMessage() {
        this.warningMessage = `Failed to produce valid query. 
      The query below is provided just for reference and can't be used right away`;
    }

    private applySavedResult() {
        this.appStore.pipe(select(getActiveTab))
            .pipe(
                filter(Boolean),
                distinctUntilChanged((tab1: TabModel, tab2: TabModel) => tab1?.id === tab2?.id),
                takeUntil(this.destroy$)
            ).subscribe(({ id }) => {
                this.tabId = id;
                const [inputQuery, output, error, streams] = this.generateQueryService.getSavedResult(`qql-${id}`) ?? [null, null];
                this.inputQuery.patchValue(inputQuery ?? '', { emitEvent: false });
                this.resultQuery = output;
                this.selectedStreamList.patchValue(streams ?? [], { emitEvent: false });
                this.qqlErrorMessage = error;

                this.setWarningMessage();
            });
    }

    private updateTabSettings(needAlert: boolean) {
        this.appStore.pipe(select(getActiveTabSettings))
            .pipe(take(1), takeUntil(this.destroy$))
            .subscribe(activeTabSettings => {
                const tabSettings = { ...activeTabSettings };
                if (needAlert) {
                    tabSettings._showOnCloseAlerts = needAlert;
                } else {
                    delete tabSettings._showOnCloseAlerts;
                }
                this.appStore.dispatch(new SetTabSettings({ tabSettings }));
            }
            );
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
