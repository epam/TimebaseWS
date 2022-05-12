import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {filter, map, take} from 'rxjs/operators';
import {AppState} from '../../core/store';
import * as fromApp from '../../core/store/app/app.reducer';
import {ExportFilter} from '../models/export-filter';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  constructor(private httpClient: HttpClient, private appStore: Store<AppState>) {}

  export(stream: string, filters: ExportFilter): Observable<{id: string}> {
    return this.httpClient.post<{id: string}>(`/${encodeURIComponent(stream)}/export`, filters);
  }

  downloadUrl(exportId: string): Observable<string> {
    return this.appStore.pipe(
      select('appSelf'),
      filter((appState: fromApp.State) => appState.app_init),
      take(1),
      map((state) => `${state.apiPrefix}/download?id=${exportId}`),
    );
  }
}
