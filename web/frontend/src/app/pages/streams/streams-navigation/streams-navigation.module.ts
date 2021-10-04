import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StreamsNavigationUrlPipe } from './streams-navigation-url.pipe';
import { StreamsNavigationActiveDirective } from './streams-navigation-active.directive';



@NgModule({
  declarations: [
    StreamsNavigationUrlPipe,
    StreamsNavigationActiveDirective,
  ],
  exports: [
    StreamsNavigationUrlPipe,
    StreamsNavigationActiveDirective
  ],
  imports: [
    CommonModule
  ]
})
export class StreamsNavigationModule { }
