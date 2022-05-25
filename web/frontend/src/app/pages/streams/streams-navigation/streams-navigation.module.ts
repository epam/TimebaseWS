import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {StreamsNavigationActiveDirective} from './streams-navigation-active.directive';
import {StreamsNavigationParamsPipe} from './streams-navigation-params.pipe';
import {StreamsNavigationUrlPipe} from './streams-navigation-url.pipe';

@NgModule({
  declarations: [
    StreamsNavigationUrlPipe,
    StreamsNavigationParamsPipe,
    StreamsNavigationActiveDirective,
  ],
  exports: [
    StreamsNavigationUrlPipe,
    StreamsNavigationActiveDirective,
    StreamsNavigationParamsPipe,
  ],
  imports: [CommonModule],
})
export class StreamsNavigationModule {}
