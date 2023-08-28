import { Component, OnDestroy, OnInit }                    from '@angular/core';
import { UntypedFormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Store }                                           from '@ngrx/store';
import { TranslateService }                   from '@ngx-translate/core';
import { BsModalRef }                         from 'ngx-bootstrap/modal';
import { of, ReplaySubject }                                   from 'rxjs';
import { debounceTime, delay, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { AppState }                                            from '../../../../../core/store';
import { ErrorLocation }                      from '../../../../../shared/models/query';
import { MonacoQqlConfigService }             from '../../../../../shared/services/monaco-qql-config.service';
import { MonacoQqlTokensService }             from '../../../../../shared/services/monaco-qql-tokens.service';
import { ViewsService }                       from '../../../../../shared/services/views.service';
import { noSpecialSymbols }                   from '../../../../../shared/utils/validators';
import { QueryService }                       from '../../../../query/services/query.service';
import * as NotificationsActions
                                              from '../../../../../core/modules/notifications/store/notifications.actions';

@Component({
  selector: 'app-create-view-modal',
  templateUrl: './create-view-modal.component.html',
  styleUrls: ['./create-view-modal.component.scss'],
  providers: [MonacoQqlConfigService, MonacoQqlTokensService],
})
export class CreateViewModalComponent implements OnInit, OnDestroy {
  
  textError: string;
  hasError: boolean;
  errorLocation: ErrorLocation;
  form: UntypedFormGroup;
  beErrorText: string;
  queryError: string;
  
  private destroy$ = new ReplaySubject();
  
  constructor(
    private queryService: QueryService,
    private viewsService: ViewsService,
    private monacoQqlConfigService: MonacoQqlConfigService,
    private fb: UntypedFormBuilder,
    private bsModalRef: BsModalRef,
    private appStore: Store<AppState>,
    private translateService: TranslateService,
  ) { }
  
  ngOnInit(): void {
    this.form = this.fb.group({
      title: [null, [Validators.required, noSpecialSymbols()]],
      query: [null],
      live: true
    });
  }
  
  createView() {
    const {title, query, live} = this.form.getRawValue();
    this.viewsService.save(title, query, live).pipe(
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
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
