import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import {ResizableComponent} from './resizable.component';

@NgModule({
  declarations: [ResizableComponent],
  imports: [CommonModule, TranslateModule, TooltipModule ],
  exports: [ResizableComponent],
})
export class ResizableModule {}