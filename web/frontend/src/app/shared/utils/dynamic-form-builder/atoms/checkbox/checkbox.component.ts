import { Component, Input } from '@angular/core';
import { FormGroup }        from '@angular/forms';

@Component({
  selector: 'app-checkbox',
  template: `
    <div [formGroup]="form">
      <label class="container-ch">
        <input
          type="checkbox"
          [formControlName]="field.name"
          [attr.readonly]="field.readonly"
          [id]="(field.parentName || '') + field.name">
        <span class="checkmark"></span>
      </label>
    </div>
  `,
  styleUrls: ['./checkbox.component.scss'],
})
export class CheckBoxComponent {
  @Input() field: any = {};
  @Input() form: FormGroup;
}
