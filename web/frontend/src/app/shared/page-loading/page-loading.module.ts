import { NgModule }             from '@angular/core';
import { CommonModule }         from '@angular/common';
import { ErrorModule }          from '../error/error.module';
import { PageLoadingComponent } from './page-loading.component';


@NgModule({
  declarations: [
    PageLoadingComponent,
  ],
  exports: [
    PageLoadingComponent,
  ],
  imports: [
    CommonModule,
    ErrorModule,
  ],
})
export class PageLoadingModule {
}
