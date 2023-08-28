import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-symbol-setting',
  templateUrl: './symbol-setting.component.html',
  styleUrls: ['./symbol-setting.component.scss']
})
export class SymbolSettingComponent implements OnInit {

  constructor(private fb: FormBuilder) { }

  applyTransformation: boolean = false;
  mappingItems = [{ name: 'NO MAPPING', id: 'NO MAPPING' }];
  formGroup: FormGroup;
  unmappedKeysHandlingOptions = ['Skip Unmapped Keys', 'Abort on Unmapped Key'];

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      applyTransformation: false,
      useCaseInsentitive: {value: false, disabled: true},
      pattern: {value: '\..*', disabled: true},
      replacement: {value: '', disabled: true},
      unmappedKeysOptions: 'Skip Unmapped Keys',
      mapping: 'NO MAPPING',
    });
  }

  toggleTransformationApplying(event) {
    const targteFormControls = ['useCaseInsentitive', 'pattern', 'replacement'];
    if (event.target.checked) {
      targteFormControls.forEach(controlName => this.formGroup.get(controlName).enable());
    } else {
      targteFormControls.forEach(controlName => this.formGroup.get(controlName).disable());
    }
  }
}