import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup }                            from '@angular/forms';
import { isArray }                                           from 'ngx-bootstrap';
import { SimpleColumnModel }                                 from '../../../../services/schema-data.service';

@Component({
  selector: 'app-form-group',
  template: `
    <ng-template ngFor let-control let-index="index" [ngForOf]="getControls(form)" [ngForTrackBy]="trackByFn">

      <ng-container *ngIf="ifGroup(control.control)">
        <!--        <div class="form-group-wr">-->
        <!--<label class="form-control-label" [attr.for]="control.controlName">
          {{control.controlTitle}}
          <strong class="text-danger" *ngIf="(getControlConfig(control.controlName)).required">*</strong>
        </label>-->
        <app-form-group class="form-group-wr" [form]="control.control" [simpleConfig]="getConfig(control.controlName)"></app-form-group>
        <!--        </div>-->
      </ng-container>
      <ng-container *ngIf="!ifGroup(control.control)">
        <!--        <div class="form-control-wr">-->
        <app-form-control class="form-control-wr" [control]="control" [config]="getControlConfig(control.controlName)"></app-form-control>
        <!--        </div>-->
      </ng-container>
    </ng-template>`,
  // templateUrl: './form-group/form-group.component.html',
  // styleUrls: ['./form-group/form-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormGroupComponent implements OnInit {

  @Input() form: FormGroup;
  @Input() simpleConfig: SimpleColumnModel[];

  constructor() { }

  ngOnInit() {
  }

  public trackByFn(index, control) {
    return control.controlName;
  }

  public getControlConfig(controlName) {
    const configIndex = this.simpleConfig.findIndex(config => config.field === controlName);
    const config = this.simpleConfig[configIndex];
    return config;
  }

  public getConfig(controlName) {
    const configIndex = this.simpleConfig.findIndex(config => config.field === controlName);
    const config = this.simpleConfig[configIndex];
    return isArray(config.children) ? config.children : [];
  }

  public getControls(formGroup: FormGroup) {
    const CONTROLS = Object.keys(formGroup.controls).map(controlName => {
      const CONFIG = this.simpleConfig.find(config => config.field === controlName);

      return {
        controlName: controlName,
        controlTitle: CONFIG.headerName || controlName,
        control: (formGroup.get(controlName) as FormGroup | FormControl),
      };
    });

    return CONTROLS;
  }

  public ifGroup(control: FormGroup | FormControl) {
    return (control instanceof FormGroup);
  }
}
