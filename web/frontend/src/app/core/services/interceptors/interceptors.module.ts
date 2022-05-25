import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {ApiPrefixesInterceptor} from './api-prefixes.interceptor';
import {AttachTokenInterceptor} from './attach-token.interceptor';
import {CatchConnectionErrorInterceptor} from './catch-connection-error.interceptor';
import {RequestDefaultErrorInterceptor} from './request-default-error.interceptor';

@NgModule({
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: RequestDefaultErrorInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: AttachTokenInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: ApiPrefixesInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: CatchConnectionErrorInterceptor, multi: true},
  ],
})
export class InterceptorsModule {}
