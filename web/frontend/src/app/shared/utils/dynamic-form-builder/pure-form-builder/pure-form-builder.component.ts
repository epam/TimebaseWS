import { Component, Input, OnInit } from '@angular/core';
import { FormGroup }                from '@angular/forms';
import { FieldModel }               from '../field-builder/field-model';

@Component({
  selector: 'app-pure-form-builder',
  templateUrl: './pure-form-builder.component.html',
  styleUrls: ['./../dynamic-form-builder.module.scss'],
})
export class PureFormBuilderComponent {
  @Input() form: FormGroup;
  @Input() fields: any[];
  
  trackByName(index, field: FieldModel): string {
    return field?.name;
  }
}
