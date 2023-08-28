import { Component, OnInit }          from '@angular/core';
import { UntypedFormControl, Validators }    from '@angular/forms';
import { Store }                      from '@ngrx/store';
import { TranslateService }           from '@ngx-translate/core';
import { BsModalRef }                 from 'ngx-bootstrap/modal';
import { of }                         from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { AppState }                   from '../../../core/store';
import { ViewsService }               from '../../../shared/services/views.service';
import * as NotificationsActions      from '../../../core/modules/notifications/store/notifications.actions';
import { noSpecialSymbols }           from '../../../shared/utils/validators';

@Component({
  selector: 'app-create-view-query',
  templateUrl: './create-view-query.component.html',
  styleUrls: ['./create-view-query.component.scss'],
})
export class CreateViewQueryComponent implements OnInit {
  
  query: string;
  titleControl: UntypedFormControl;
  liveView: UntypedFormControl;
  beErrorText: string;
  
  constructor(
    private bsModalRef: BsModalRef,
    private viewsService: ViewsService,
    private appStore: Store<AppState>,
    private translateService: TranslateService,
  ) { }

  ngOnInit(): void {
    this.titleControl = new UntypedFormControl(null, [Validators.required, noSpecialSymbols()]);
    this.liveView = new UntypedFormControl(true);
  }
  
  close() {
    this.bsModalRef.hide();
  }
  
  create() {
    this.viewsService.save(this.titleControl.value, this.query, this.liveView.value).pipe(
      switchMap(() => this.translateService.get('qqlEditor.createViewModal.successCreated', {name: this.titleControl.value})),
      tap(message => {
        this.bsModalRef.hide();
        this.appStore.dispatch(
          new NotificationsActions.AddNotification({
            message,
            dismissible: true,
            closeInterval: 1500,
            type: 'success',
          }),
        );
      }),
      catchError((error) => {
        this.titleControl.setErrors({beError: true});
        this.beErrorText = error.error.message;
        return of(null);
      }),
    ).subscribe();
  }
}
