import {Component, EventEmitter, Input, Output} from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';
import {FieldModel} from '../field-builder/field-model';

@Component({
  selector: 'app-pure-form-builder',
  templateUrl: './pure-form-builder.component.html',
  styleUrls: ['./../dynamic-form-builder.module.scss'],
})
export class PureFormBuilderComponent {
  @Input() form: UntypedFormGroup;
  @Input() fields: any[];
  @Input() alignLabels = true;

  @Output() editJson = new EventEmitter<FieldModel>();

  trackByName(index, field: FieldModel): string {
    return field?.name;
  }

  onEditJson(field: FieldModel) {
    this.editJson.emit(field);
  }
}
