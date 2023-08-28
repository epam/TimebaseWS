import {Component, ErrorHandler, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormControl} from '@angular/forms';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {fromEvent, ReplaySubject} from 'rxjs';
import {filter, map, switchMap, take, takeUntil, withLatestFrom} from 'rxjs/operators';
import * as NotificationsActions from '../../../../../../core/modules/notifications/store/notifications.actions';
import {AppState} from '../../../../../../core/store';
import {ConfirmModalService} from '../../../../../../shared/components/modals/modal-on-close-alert/confirm-modal.service';
import {GlobalErrorHandler} from '../../../../../../shared/services/global-error.handler';
import {OnCloseTabAlertService} from '../../../../services/on-close-tab-alert.service';
import {SeFieldFormsService} from '../../services/se-field-forms.service';
import {EditSchemaUpdateState} from '../../store/schema-editor.actions';

@Component({
  selector: 'app-schema-upload-btn',
  templateUrl: './schema-upload-btn.component.html',
})
export class SchemaUploadBtnComponent implements OnInit, OnDestroy {
  control = new UntypedFormControl();

  private destroy$ = new ReplaySubject(1);

  constructor(
    private appStore: Store<AppState>,
    private seFieldFormsService: SeFieldFormsService,
    private translateService: TranslateService,
    private confirmModalService: ConfirmModalService,
    private errorHandler: ErrorHandler,
    private router: Router,
    private onCloseTabAlertService: OnCloseTabAlertService,
  ) {}

  ngOnInit(): void {
    this.control.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        withLatestFrom(this.translateService.get('schemaEditor.importFromJson')),
        switchMap(([files, messages]: [FileList, {jsonParseError: string; dataError: string}]) => {
          const fr = new FileReader();

          const result$ = fromEvent(fr, 'load').pipe(
            take(1),
            map(() => {
              try {
                const json = JSON.parse(fr.result as string);
                const dataError = this.validate(json);
                if (dataError) {
                  this.errorNotification(`${messages.dataError} ${dataError}`);
                  return null;
                }
                json.state.classes.forEach(classItem => {
                  if (classItem.isAbstract) {
                    classItem._props._isUsed = false;
                  }
                })

                return json;
              } catch (e) {
                this.errorNotification(messages.jsonParseError);
                return null;
              }
            }),
          );

          fr.readAsText(files[0]);
          this.control.patchValue(null, {emitEvent: false});

          return result$;
        }),
        filter(Boolean),
        switchMap((json) =>
          this.confirmModalService
            .confirm('schemaEditor.importFromJson.confirm')
            .pipe(map((confirm) => (confirm ? json : null))),
        ),
        filter(Boolean),
      )
      .subscribe((json) => this.updateSchema(json));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private errorNotification(error: string) {
    this.appStore.dispatch(
      new NotificationsActions.AddAlert({
        message: error,
        dismissible: true,
        closeInterval: 3000,
      }),
    );
  }

  private updateSchema(json) {
    (this.errorHandler as GlobalErrorHandler)
      .catchErrors(() => {
        this.seFieldFormsService.restoreFromState(json.formState);
        this.appStore.dispatch(
          EditSchemaUpdateState({
            classes: json.state.classes,
            enums: json.state.enums,
          }),
        );
      })
      .pipe(
        take(1),
        filter(Boolean),
        switchMap(() => this.translateService.get('schemaEditor.importFromJson.unhandledError')),
        switchMap((message) =>
          this.onCloseTabAlertService.doWithoutAlert().pipe(map(() => message)),
        ),
      )
      .subscribe((errorMessage) => {
        this.errorNotification(errorMessage);
        const currentUrl = this.router.url;
        this.router
          .navigateByUrl('/', {skipLocationChange: true})
          .then(() => this.router.navigate([currentUrl]));
      });
  }

  private validate(json: unknown): string {
    const objectV = (object: object) => {
      return (data) => {
        for (const key of Object.keys(object)) {
          if (!data.hasOwnProperty(key)) {
            return key;
          }

          if (object[key]) {
            const downNotValidKey = object[key](data[key]);
            if (downNotValidKey) {
              return `${key}.${downNotValidKey}`;
            }
          }
        }

        return null;
      };
    };

    const arrayV = (elementValidator) => {
      return (data) => {
        if (!Array.isArray(data)) {
          return 'not-array';
        }

        for (const i in data) {
          const downNotValidKey = elementValidator(data[i]);
          if (downNotValidKey) {
            return `${i}.${downNotValidKey}`;
          }
        }
      };
    };

    const booleanV = (data) => (typeof data === 'boolean' ? null : 'not-boolean');
    const stringV = (data) => (typeof data === 'string' ? null : 'not-string');
    const arrayOfObj = (object) => arrayV(objectV(object));
    const objectMapV = (valueType) => (object) => {
      if (typeof object !== 'object' || Array.isArray(object)) {
        return 'not-object';
      }

      if (Object.values(object).find((value) => typeof value !== valueType)) {
        return `value-not-${valueType}`;
      }
    };

    const validator = objectV({
      state: objectV({
        classes: arrayOfObj({
          fields: arrayOfObj({
            name: null,
            title: null,
          }),
          name: null,
          title: null,
        }),
        enums: arrayOfObj({
          name: null,
          title: null,
          fields: arrayOfObj({
            name: null,
            title: null,
          }),
        }),
      }),
      formState: objectV({
        hasAnyError: booleanV,
        formChanged: arrayV(stringV),
        typesHasChanges: arrayV(stringV),
        lastField: stringV,
        hasError: objectMapV('boolean'),
        touched: arrayV(stringV),
        originalFormState: objectMapV('object'),
        isTypeFieldsChanged: arrayV(stringV),
        originalFields: objectMapV('string'),
      }),
    });

    return validator(json);
  }
}
