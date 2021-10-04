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
export class ImportService {
  constructor(
    private httpClient: HttpClient,
  ) {
  }

  import(data: object): Observable<unknown> {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    return this.httpClient.post(`/import`, formData);
  }
}
