import { NgModule }                    from '@angular/core';
import { ReactiveFormsModule }         from '@angular/forms';
import { SharedModule }                from '../../shared.module';
// components
import { ArrayComponent }              from './atoms/array/array';
import { CheckBoxComponent }           from './atoms/checkbox/checkbox.component';
import { DropDownComponent }           from './atoms/dropdown';
import { FileComponent }               from './atoms/file';
import { MultiselectComponent }        from './atoms/multiselect/multiselect.component';
import { RadioComponent }              from './atoms/radio';
import { TextBoxComponent }            from './atoms/textbox/textbox';
import { TimepickerComponent }         from './atoms/timepicker/timepicker.component';
import { DynamicFormBuilderComponent } from './dynamic-form-builder.component';
import { FieldBuilderComponent }       from './field-builder/field-builder.component';
import { PureFormBuilderComponent } from './pure-form-builder/pure-form-builder.component';

@NgModule({
  imports: [
    SharedModule,
    ReactiveFormsModule,
  ],
  declarations: [
    DynamicFormBuilderComponent,
    FieldBuilderComponent,
    TextBoxComponent,
    DropDownComponent,
    CheckBoxComponent,
    FileComponent,
    RadioComponent,
    ArrayComponent,
    MultiselectComponent,
    TimepickerComponent,
    PureFormBuilderComponent,
  ],
  exports: [DynamicFormBuilderComponent, CheckBoxComponent, RadioComponent, PureFormBuilderComponent],
  providers: [],
})
export class DynamicFormBuilderModule {
}
