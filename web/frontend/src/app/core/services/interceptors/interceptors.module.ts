import { NgModule }                       from '@angular/core';
import { HTTP_INTERCEPTORS }              from '@angular/common/http';
import { ApiPrefixesInterceptor }         from './api-prefixes.interceptor';
import { RequestDefaultErrorInterceptor } from './request-default-error.interceptor';
import { AttachTokenInterceptor }         from './attach-token.interceptor';


@NgModule({
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: RequestDefaultErrorInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: AttachTokenInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: ApiPrefixesInterceptor, multi: true},
  ],
})
export class InterceptorsModule {
}
