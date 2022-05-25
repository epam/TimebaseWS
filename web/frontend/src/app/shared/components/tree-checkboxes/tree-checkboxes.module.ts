import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {TreeCheckboxesComponent} from './tree-checkboxes.component';

@NgModule({
  declarations: [TreeCheckboxesComponent],
  exports: [TreeCheckboxesComponent],
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
})
export class TreeCheckboxesModule {}
