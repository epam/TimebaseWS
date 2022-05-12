import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {AgGridModule} from 'ag-grid-angular';
import {LiveGridComponent} from './live-grid.component';

@NgModule({
  declarations: [LiveGridComponent],
  exports: [LiveGridComponent],
  imports: [CommonModule, AgGridModule],
})
export class LiveGridModule {}
