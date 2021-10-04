import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store }                              from '@ngrx/store';
import { ICellRendererAngularComp }           from 'ag-grid-angular';
import { ICellRendererParams }                from 'ag-grid-community';
import { AppState }                           from 'src/app/core/store';
import { SchemaClassTypeModel }               from 'src/app/shared/models/schema.class.type.model';
import { ChangeSchemaItem }                   from '../../../../store/schema-editor.actions';

@Component({
  selector: 'app-is-used-cb',
  templateUrl: './is-used-cb.component.html',
  styleUrls: ['./is-used-cb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsUsedCbComponent implements ICellRendererAngularComp {
  public typeItem: SchemaClassTypeModel;

  // public dataLostForm: FormGroup;

  constructor(
    private appStore: Store<AppState>,
    // private fb: FormBuilder,
  ) { }

  agInit(params: ICellRendererParams): void {
    this.typeItem = params.data;
    // if (this.typeItem) debugger;
  }

  refresh(params: any): boolean {
    return false;
  }

  public onSetUsed($event: Event, item: SchemaClassTypeModel) {
    // this.appStore.dispatch(ChangeUsedState({
    //   isUsed: ($event.currentTarget as HTMLInputElement).checked,
    //   typeItem: typeItem,
    // }));
    this.appStore.dispatch(ChangeSchemaItem({
      itemName: item.name,
      item: {
        ...item,
        _props: {...item._props, _isUsed: ($event.currentTarget as HTMLInputElement).checked},
      },
    }));
    // $event.stopImmediatePropagation();
  }


}
