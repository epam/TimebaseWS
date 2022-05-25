import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {ICellRendererAngularComp} from 'ag-grid-angular';
import {ICellRendererParams} from 'ag-grid-community';
import {Observable} from 'rxjs';
import {AppState} from 'src/app/core/store';
import {SchemaClassTypeModel} from 'src/app/shared/models/schema.class.type.model';
import {PermissionsService} from '../../../../../../../../shared/services/permissions.service';
import {ChangeSchemaItem} from '../../../../store/schema-editor.actions';

@Component({
  selector: 'app-is-used-cb',
  templateUrl: './is-used-cb.component.html',
  styleUrls: ['./is-used-cb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsUsedCbComponent implements OnInit, ICellRendererAngularComp {
  public typeItem: SchemaClassTypeModel;
  readOnly$: Observable<boolean>;

  constructor(private appStore: Store<AppState>, private permissionsService: PermissionsService) {
    this.readOnly$ = this.permissionsService.readOnly();
  }

  ngOnInit(): void {}

  agInit(params: ICellRendererParams): void {
    this.typeItem = params.data;
  }

  refresh(params: any): boolean {
    return false;
  }

  public onSetUsed($event: Event, item: SchemaClassTypeModel) {
    this.appStore.dispatch(
      ChangeSchemaItem({
        itemName: item.name,
        item: {
          ...item,
          _props: {...item._props, _isUsed: ($event.currentTarget as HTMLInputElement).checked},
        },
      }),
    );
  }
}
