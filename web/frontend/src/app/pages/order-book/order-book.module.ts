import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {NgMultiSelectDropDownModule} from 'ng-multiselect-dropdown';
import {MultiselectNormalizeModule} from '../../shared/directives/single-dropdown/multiselect-normalize.module';
import {OrderBookPageComponent} from './order-book-page/order-book-page.component';
import {OrderBookComponent} from './order-book/order-book.component';

@NgModule({
  declarations: [OrderBookPageComponent, OrderBookComponent],
  imports: [
    CommonModule,
    NgMultiSelectDropDownModule,
    ReactiveFormsModule,
    TranslateModule,
    FormsModule,
    MultiselectNormalizeModule,
  ],
  exports: [OrderBookComponent],
})
export class OrderBookModule {}
