import {CommonModule}                 from '@angular/common';
import {NgModule}                     from '@angular/core';
import {ReactiveFormsModule}          from '@angular/forms';
import { ButtonsModule }              from 'ngx-bootstrap/buttons';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { WriteModesControlComponent } from './write-modes-control.component';

@NgModule({
  declarations: [WriteModesControlComponent],
  exports: [WriteModesControlComponent],
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, TooltipModule, ButtonsModule],
})
export class WriteModesModule {}
