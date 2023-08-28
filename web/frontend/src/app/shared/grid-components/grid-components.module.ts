import { CommonModule }          from '@angular/common';
import { NgModule }              from '@angular/core';
import { ReactiveFormsModule }   from '@angular/forms';
import { TranslateModule }       from '@ngx-translate/core';
import { ContextMenuModule }     from '@perfectmemory/ngx-contextmenu';
import { AgGridModule }          from 'ag-grid-angular';
import { TooltipModule }         from 'ngx-bootstrap/tooltip';
import { IsAbstractCbComponent } from '../../pages/streams/modules/schema-editor/components/class-list-grid/grid-components/is-abstract-cb/is-abstract-cb.component';
import { IsUsedCbComponent }     from '../../pages/streams/modules/schema-editor/components/class-list-grid/grid-components/is-used-cb/is-used-cb.component';
import { TreeDataCellComponent } from '../../pages/streams/modules/schema-editor/components/class-list-grid/grid-components/tree-data-cell/tree-data-cell.component';
import { ResolutionComponent }   from '../../pages/streams/modules/schema-editor/components/diff/grid-components/data-lost/resolution.component';
import { MultiSelectModule }     from '../components/multi-select/multi-select.module';
import { SelectModule }          from '../components/select/select.module';
import { TreeCheckboxesModule }  from '../components/tree-checkboxes/tree-checkboxes.module';
import { GridContextMenuService }        from './grid-context-menu.service';
import { GridHeaderGlobalMenuComponent } from './grid-header-gobal-menu/grid-header-global-menu.component';
import { GridHeaderComponent }           from './grid-header/grid-header.component';
import { GridSearchComponent }           from './grid-search/grid-search.component';
import { GridTextFilterComponent }       from './filters/grid-text-filter/grid-text-filter.component';
import { GridDropdownFilterComponent }   from './filters/grid-dropdown-filter/grid-dropdown-filter.component';
import { GridHeaderPreviewComponent } from './grid-header-preview/grid-header-preview.component';

// TODO: Move all grid components to this module
@NgModule({
  declarations: [
    GridHeaderGlobalMenuComponent,
    GridHeaderComponent,
    TreeDataCellComponent,
    IsAbstractCbComponent,
    IsUsedCbComponent,
    ResolutionComponent,
    GridSearchComponent,
    GridTextFilterComponent,
    GridDropdownFilterComponent,
    GridHeaderPreviewComponent,
  ],
  imports: [
    CommonModule,
    ContextMenuModule,
    TreeCheckboxesModule,
    ReactiveFormsModule,
    AgGridModule.withComponents([
      GridHeaderGlobalMenuComponent,
      GridDropdownFilterComponent,
      GridSearchComponent,
      GridTextFilterComponent,
      GridHeaderComponent,
      ResolutionComponent,
      IsUsedCbComponent,
      IsAbstractCbComponent,
      TreeDataCellComponent,
    ]),
    TranslateModule,
    SelectModule,
    MultiSelectModule,
    TooltipModule,
    ContextMenuModule,
  ],
  providers: [GridContextMenuService],
})
export class CustomGridComponentsModule {
}
