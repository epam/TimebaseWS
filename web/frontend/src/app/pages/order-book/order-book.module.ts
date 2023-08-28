import {CommonModule}                     from '@angular/common';
import {NgModule}                         from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslateModule}                  from '@ngx-translate/core';
import {NgMultiSelectDropDownModule}      from 'ng-multiselect-dropdown';
import { TopFiltersPageLayoutComponent }  from '../../shared/components/top-filters-page-layout/top-filters-page-layout.component';
import {ClickOutsideModule}               from '../../shared/directives/click-outside/click-outside.module';
import {MultiselectNormalizeModule}       from '../../shared/directives/single-dropdown/multiselect-normalize.module';
import {OrderBookPageComponent}           from './order-book-page/order-book-page.component';
import {OrderBookComponent}               from './order-book/order-book.component';


@NgModule({
  declarations: [OrderBookPageComponent, OrderBookComponent],
  imports: [
    CommonModule,
    NgMultiSelectDropDownModule,
    ReactiveFormsModule,
    TranslateModule,
    FormsModule,
    MultiselectNormalizeModule,
    ClickOutsideModule,
    TopFiltersPageLayoutComponent,
  ],
  exports: [OrderBookComponent],
})
export class OrderBookModule {}
