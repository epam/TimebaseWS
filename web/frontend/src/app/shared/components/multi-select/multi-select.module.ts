import {PortalModule} from '@angular/cdk/portal';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MultiSelectComponent} from './multi-select.component';

@NgModule({
  declarations: [MultiSelectComponent],
  imports: [CommonModule, ScrollingModule, ReactiveFormsModule, FormsModule, PortalModule],
  exports: [MultiSelectComponent],
})
export class MultiSelectModule {}
