import { Component, OnDestroy }     from '@angular/core';
import { select, Store }            from '@ngrx/store';
import { TranslateService }         from '@ngx-translate/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams }      from 'ag-grid-community';
import { Subject }                  from 'rxjs';
import { take, takeUntil }          from 'rxjs/operators';
import { AppState }                 from 'src/app/core/store';
import { SchemaClassTypeModel }     from 'src/app/shared/models/schema.class.type.model';
import * as NotificationsActions
                                    from '../../../../../../../../core/modules/notifications/store/notifications.actions';
import { ChangeSchemaItem }         from '../../../../store/schema-editor.actions';
import { getAllClasses }            from '../../../../store/schema-editor.selectors';

@Component({
  selector: 'app-is-abstract-cb',
  templateUrl: './is-abstract-cb.component.html',
  styleUrls: ['./is-abstract-cb.component.scss'],
})
export class IsAbstractCbComponent implements ICellRendererAngularComp, OnDestroy {
  public typeItem: SchemaClassTypeModel;
  private destroy$ = new Subject();

  // public dataLostForm: FormGroup;

  constructor(
    private appStore: Store<AppState>,
    private translate: TranslateService,
    // private fb: FormBuilder,
  ) { }

  agInit(params: ICellRendererParams): void {
    this.typeItem = params.data;
    // if (this.typeItem) debugger;
  }

  refresh(params: any): boolean {
    return false;
  }

  public onSetAbstract($event: Event, item: SchemaClassTypeModel) {
    // this.appStore.dispatch(ChangeUsedState({
    //   isUsed: ($event.currentTarget as HTMLInputElement).checked,
    //   typeItem: typeItem,
    // }));
    this.appStore
      .pipe(
        select(getAllClasses),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe(classes => {
        const USED_IN_CLASSES: string[] = this.isClassUsed(classes, item);
        if (USED_IN_CLASSES.length) {
          ($event.currentTarget as HTMLInputElement).checked = false;
          this.translate
            .get('notification_messages.isAbstractActivateError', {classListString: USED_IN_CLASSES.join('<br>')})
            .pipe(
              take(1),
              takeUntil(this.destroy$),
            )
            .subscribe(message => {
              this.appStore.dispatch(new NotificationsActions.AddWarn({
                message: message,
                dismissible: true,
                closeInterval: 10000,
              }));
            });
        } else {
          this.appStore.dispatch(ChangeSchemaItem({
            itemName: item.name,
            item: {
              ...item,
              isAbstract: ($event.currentTarget as HTMLInputElement).checked,
              _props: {...item._props, _isUsed: false},
            },
          }));
        }
      });
    // $event.stopImmediatePropagation();
  }

  private isClassUsed(classes: SchemaClassTypeModel[], currentItem: SchemaClassTypeModel): string[] {
    const USED_IN_CLASSES = [];
    classes.forEach(_class => {
      _class.fields.forEach(field => {
        if (field.type && field.type.name === 'OBJECT' && field.type.types && field.type.types.some(_typeName => _typeName === currentItem.name)) {
          USED_IN_CLASSES.push(`${_class.name} -> ${field.name}`);
        }
      });
    });
    return USED_IN_CLASSES;
  }


  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

  }
}
