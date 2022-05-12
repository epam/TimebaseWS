import {HttpClient} from '@angular/common/http';
import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {switchMap, tap} from 'rxjs/operators';
import * as NotificationsActions from '../../../../../core/modules/notifications/store/notifications.actions';
import {AppState} from '../../../../../core/store';

// text,email,tel,textarea,password,
@Component({
  selector: 'app-textbox',
  template: `
    <div [formGroup]="form" class="d-flex">
      <input
        [attr.type]="field.type === 'binary' ? 'text' : field.type"
        class="form-control w-100"
        [id]="(field.parentName || '') + field.name"
        [name]="field.name"
        [formControlName]="field.name"
        [attr.tabindex]="field.readonly ? -1 : null"
        [attr.readonly]="field.readonly || field.upload_file" />
      <ng-template [ngIf]="field.upload_file">
        <div class="d-flex btns-wr">
          <input
            #uploadInput
            type="file"
            class="upload-control"
            (change)="onUpload($event)"
            tabindex="-1" />

          <button
            class="btn btn-primary btn-upload"
            type="button"
            tabindex="0"
            (click)="uploadInput.click()">
            {{ 'buttons.upload' | translate }}
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styleUrls: ['./textbox.scss'],
})
export class TextBoxComponent implements OnInit {
  @Input() field: any = {};
  @Input() form: FormGroup;

  constructor(
    private httpClient: HttpClient,
    private translate: TranslateService,
    private appStore: Store<AppState>,
  ) {}

  ngOnInit(): void {
    // console.log('input - ', this.field);
  }

  onUpload(event: Event) {
    if (!event.target['files'] || !event.target['files'][0]) return;
    if (!this.form.get('name') && !this.form.get('name').value) return;
    if (!this.form['_connectorType']) return;
    const file: File = event.target['files'][0];
    this.translate
      .get('notification_messages')
      .pipe(
        switchMap((messages: string) => {
          const formData = new FormData();
          let url = `connectors/${this.form['_connectorType']}/stunnel/cert/upload/${
            this.form.get('name').value
          }`;

          if (this.field.upload_file_info) {
            url += `?file_info=${this.field.upload_file_info}`;
          }
          formData.append('file', file, file.name);
          formData.append('file_name', file.name);

          return this.httpClient.post(url, formData).pipe(
            tap(() => {
              this.appStore.dispatch(
                new NotificationsActions.AddNotification({
                  closeInterval: 5000,
                  message: messages['certificateIsUploaded'],
                }),
              );
            }),
          );
        }),
      )
      .subscribe((response) => {
        this.form.get(this.field.name).reset(response['file']);
      });
    // $event.target.files
  }
}
