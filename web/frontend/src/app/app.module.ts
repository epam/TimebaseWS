import { HttpClient, HttpClientModule }     from '@angular/common/http';
import { NgModule }                         from '@angular/core';
import { BrowserModule }                    from '@angular/platform-browser';
import { BrowserAnimationsModule }          from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader }              from '@ngx-translate/http-loader';
import { AngularSplitModule }               from 'angular-split';
import { ContextMenuModule }                from 'ngx-contextmenu';
import { MonacoEditorModule }               from 'ngx-monaco-editor';
import { AppRoutingModule }                 from './app-routing.module';
import { AppComponent }                     from './core/components/app/app.component';
import { CoreModule }                       from './core/core.module';
import { SharedModule }                     from './shared/shared.module';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    HttpClientModule,
    AngularSplitModule.forRoot(),
    MonacoEditorModule.forRoot(),

    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (HttpLoaderFactory),
        deps: [HttpClient],
      },
    }),

    AppRoutingModule,
    ContextMenuModule.forRoot({
      useBootstrap4: true,
    }),
    CoreModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
