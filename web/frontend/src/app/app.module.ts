import {HttpClient, HttpClientModule} from '@angular/common/http';
import {ErrorHandler, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NgSelectModule} from '@ng-select/ng-select';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {AngularSplitModule} from 'angular-split';
import {AccordionModule} from 'ngx-bootstrap/accordion';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {ModalModule} from 'ngx-bootstrap/modal';
import {ContextMenuModule} from 'ngx-contextmenu';
import {MonacoEditorModule} from 'ngx-monaco-editor';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './core/components/app/app.component';
import {CoreModule} from './core/core.module';
import {CustomGridComponentsModule} from './shared/grid-components/grid-components.module';
import {GlobalErrorHandler} from './shared/services/global-error.handler';
import {MonacoService} from './shared/services/monaco.service';
import {SharedModule} from './shared/shared.module';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    HttpClientModule,
    AngularSplitModule.forRoot(),
    MonacoEditorModule.forRoot({onMonacoLoad: MonacoService.onMonacoLoadHandler}),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),

    AppRoutingModule,
    ContextMenuModule.forRoot({
      useBootstrap4: true,
    }),
    CoreModule,
    AccordionModule.forRoot(),
    ModalModule.forRoot(),
    CustomGridComponentsModule,
    NgSelectModule,
    BsDropdownModule.forRoot(),
  ],
  bootstrap: [AppComponent],
  providers: [
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
  ],
})
export class AppModule {}
