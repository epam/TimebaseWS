import { Component, OnDestroy, OnInit }                    from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { select, Store }                                           from '@ngrx/store';
import { TranslateService }                   from '@ngx-translate/core';
import { BsModalRef }                         from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable, Subject }                        from 'rxjs';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { AppState }                                            from '../../../../../core/store';
import { ErrorLocation }                      from '../../../../../shared/models/query';
import { MonacoQqlConfigService }             from '../../../../../shared/services/monaco-qql-config.service';
import { MonacoQqlTokensService }             from '../../../../../shared/services/monaco-qql-tokens.service';
import { ViewsService }                       from '../../../../../shared/services/views.service';
import { noSpecialSymbols }                   from '../../../../../shared/utils/validators';
import * as NotificationsActions from '../../../../../core/modules/notifications/store/notifications.actions';
import { getDefaultTimebase, getTimebases } from '../../../store/timebases/timebases.selectors';
import { TimebaseInstanceDef } from '../../../../../shared/models/timebase-instance-def.model';

@Component({
  selector: 'app-create-view-modal',
  templateUrl: './create-view-modal.component.html',
  styleUrls: ['./create-view-modal.component.scss'],
  providers: [MonacoQqlConfigService, MonacoQqlTokensService],
})
export class CreateViewModalComponent implements OnInit, OnDestroy {

  tbId: string = null;
  timebases$: Observable<TimebaseInstanceDef[]>;
  private timebasesList: TimebaseInstanceDef[] = [];

  get selectedTbUnavailable(): boolean {
    return this.timebasesList.find((tb) => tb.id === this.tbId)?.connected === false;
  }

  textError: string;
  hasError: boolean;
  errorLocation: ErrorLocation;
  form: UntypedFormGroup;
  beErrorText: string;
  queryText = '';
  qureryError = true;
  titleControl: AbstractControl;
  isLiveControl: AbstractControl;
  editorIsReady$ = new BehaviorSubject(false);
  
  private destroy$ = new Subject();
  
  constructor(
    private viewsService: ViewsService,
    private fb: UntypedFormBuilder,
    private bsModalRef: BsModalRef,
    private appStore: Store<AppState>,
    private translateService: TranslateService,
  ) { }
  
  ngOnInit(): void {
    this.timebases$ = this.appStore.pipe(select(getTimebases));
    this.timebases$.pipe(takeUntil(this.destroy$)).subscribe((timebases) => {
      this.timebasesList = timebases || [];
    });

    this.appStore.pipe(select(getDefaultTimebase), take(1)).subscribe(defaultTb => {
      if (!this.tbId && defaultTb?.id) {
        this.tbId = defaultTb.id;
      }
    });

    this.form = this.fb.group({
      title: [null, [Validators.required, noSpecialSymbols()]],
      query: [null],
      live: true
    });

    this.titleControl = this.form.get('title');
    this.isLiveControl = this.form.get('live');
  }
  
  createView() {
    const {title, live} = this.form.getRawValue();
    this.viewsService.save(title, this.queryText, live, this.tbId).pipe(
      switchMap(() => this.translateService.get('qqlEditor.createViewModal.successCreated', {name: title})),
    ).subscribe((message) => {
      this.bsModalRef.hide();
      this.appStore.dispatch(
        new NotificationsActions.AddNotification({
          message,
          dismissible: true,
          closeInterval: 1500,
          type: 'success',
        }),
      );
    }, (error) => {
      this.form.get('title').setErrors({beError: true});
      this.beErrorText = error.error.message;
    });
  }

  onTbChange(tbId: string) {
    this.tbId = tbId;
  }

  queryChanged({ text, error }) {
    this.queryText = text;
    this.qureryError = error;
  }

  setEditorAsReady() {
    this.editorIsReady$.next(true);
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
