import { CommonModule }                  from '@angular/common';
import { NgModule }                      from '@angular/core';
import { ReactiveFormsModule }           from '@angular/forms';
import { TranslateModule }               from '@ngx-translate/core';
import { AgGridModule }                  from 'ag-grid-angular';
import { ContextMenuModule }             from 'ngx-contextmenu';
import { IsAbstractCbComponent }         from '../../pages/streams/modules/schema-editor/components/class-list-grid/grid-components/is-abstract-cb/is-abstract-cb.component';
import { IsUsedCbComponent }             from '../../pages/streams/modules/schema-editor/components/class-list-grid/grid-components/is-used-cb/is-used-cb.component';
import { TreeDataCellComponent }         from '../../pages/streams/modules/schema-editor/components/class-list-grid/grid-components/tree-data-cell/tree-data-cell.component';
import { ResolutionComponent }           from '../../pages/streams/modules/schema-editor/components/diff/grid-components/data-lost/resolution.component';
import { TreeCheckboxesModule }          from '../components/tree-checkboxes/tree-checkboxes.module';
import { GridContextMenuService }        from './grid-context-menu.service';
import { GridHeaderGlobalMenuComponent } from './grid-header-gobal-menu/grid-header-global-menu.component';
import { GridHeaderComponent }           from './grid-header/grid-header.component';


// TODO: Move all grid components to this module
@NgModule({
  declarations: [
    GridHeaderGlobalMenuComponent,
    GridHeaderComponent,
    TreeDataCellComponent,
    IsAbstractCbComponent,
    IsUsedCbComponent,
    ResolutionComponent,
  ],
  imports: [
    CommonModule,
    ContextMenuModule,
    TreeCheckboxesModule,
    ReactiveFormsModule,
    AgGridModule.withComponents([
      GridHeaderGlobalMenuComponent,
      GridHeaderComponent,
      ResolutionComponent,
      IsUsedCbComponent,
      IsAbstractCbComponent,
      TreeDataCellComponent,
    ]),
    TranslateModule,
  ],
  providers: [
    GridContextMenuService,
  ],
})
export class CustomGridComponentsModule {
}
