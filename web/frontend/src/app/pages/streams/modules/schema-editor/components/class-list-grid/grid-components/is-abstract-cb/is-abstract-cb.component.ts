import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {ICellRendererAngularComp} from 'ag-grid-angular';
import {ICellRendererParams} from 'ag-grid-community';
import {Observable, Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';
import {AppState} from 'src/app/core/store';
import {SchemaClassTypeModel} from 'src/app/shared/models/schema.class.type.model';
import * as NotificationsActions from '../../../../../../../../core/modules/notifications/store/notifications.actions';
import {PermissionsService} from '../../../../../../../../shared/services/permissions.service';
import {ChangeSchemaItem} from '../../../../store/schema-editor.actions';
import {getAllClasses} from '../../../../store/schema-editor.selectors';

@Component({
  selector: 'app-is-abstract-cb',
  templateUrl: './is-abstract-cb.component.html',
  styleUrls: ['./is-abstract-cb.component.scss'],
})
export class IsAbstractCbComponent implements ICellRendererAngularComp, OnInit, OnDestroy {
  typeItem: SchemaClassTypeModel;
  readOnly$: Observable<boolean>;

  private destroy$ = new Subject();

  constructor(
    private appStore: Store<AppState>,
    private translate: TranslateService,
    private permissionsService: PermissionsService,
  ) {}

  ngOnInit() {
    this.readOnly$ = this.permissionsService.readOnly();
  }

  agInit(params: ICellRendererParams): void {
    this.typeItem = params.data;
  }

  refresh(params: any): boolean {
    return false;
  }

  public onSetAbstract($event: Event, item: SchemaClassTypeModel) {
    this.appStore
      .pipe(select(getAllClasses), take(1), takeUntil(this.destroy$))
      .subscribe((classes) => {
        const USED_IN_CLASSES: string[] = this.isClassUsed(classes, item);
        if (USED_IN_CLASSES.length) {
          ($event.currentTarget as HTMLInputElement).checked = false;
          this.translate
            .get('notification_messages.isAbstractActivateError', {
              classListString: USED_IN_CLASSES.join('<br>'),
            })
            .pipe(take(1), takeUntil(this.destroy$))
            .subscribe((message) => {
              this.appStore.dispatch(
                new NotificationsActions.AddWarn({
                  message: message,
                  dismissible: true,
                  closeInterval: 10000,
                }),
              );
            });
        } else {
          this.appStore.dispatch(
            ChangeSchemaItem({
              itemName: item.name,
              item: {
                ...item,
                isAbstract: ($event.currentTarget as HTMLInputElement).checked,
                _props: {...item._props, _isUsed: false},
              },
            }),
          );
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private isClassUsed(
    classes: SchemaClassTypeModel[],
    currentItem: SchemaClassTypeModel,
  ): string[] {
    const USED_IN_CLASSES = [];
    classes.forEach((_class) => {
      _class.fields.forEach((field) => {
        if (
          field.type &&
          field.type.name === 'OBJECT' &&
          field.type.types &&
          field.type.types.some((_typeName) => _typeName === currentItem.name)
        ) {
          USED_IN_CLASSES.push(`${_class.name} -> ${field.name}`);
        }
      });
    });
    return USED_IN_CLASSES;
  }
}
