import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExportFilter } from '../models/export-filter';
import { select, Store } from '@ngrx/store';
import { filter, map, take } from 'rxjs/operators';
import * as fromApp from '../../core/store/app/app.reducer';
import { AppState } from '../../core/store';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  constructor(
    private httpClient: HttpClient,
    private appStore: Store<AppState>,
  ) {
  }

  export(stream: string, filters: ExportFilter): Observable<{ id: string }> {
    return this.httpClient.post<{ id: string }>(`/${encodeURIComponent(stream)}/export`, filters);
  }

  downloadUrl(exportId: string): Observable<string> {
    return this.appStore
      .pipe(
        select('appSelf'),
        filter((appState: fromApp.State) => appState.app_init),
        take(1),
        map(state => `${state.apiPrefix}/download?id=${exportId}`),
      );
  }
}
