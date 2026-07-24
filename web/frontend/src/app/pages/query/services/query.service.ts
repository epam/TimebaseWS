import {HttpClient}         from '@angular/common/http';
import {Injectable}         from '@angular/core';
import {Observable}         from 'rxjs';
import {ExportTypes}        from '../../../shared/models/grid-data-store.model';
import { CompileResponse }  from '../../../shared/models/query';
import {SchemaTypeModel}    from '../../../shared/models/schema.type.model';
import {StreamDetailsModel} from '../../streams/models/stream.details.model';

@Injectable({
  providedIn: 'root',
})
export class QueryService {
  constructor(private httpClient: HttpClient) {}

  serverErrorQueries = new Set<string>();

  describe(query: string, tb?: string): Observable<{types: SchemaTypeModel[]; all: SchemaTypeModel[]}> {
    const params: {[k: string]: string} = {tree: 'true'};
    if (tb) params['tb'] = tb;
    return this.httpClient.post<{types: SchemaTypeModel[]; all: SchemaTypeModel[]}>(
      `/describe`,
      {query},
      {
        params,
        headers: {
          customError: 'true',
        },
      },
    );
  }

  query(query: string, offset: number, rows: number, tb?: string) {
    const params: {[k: string]: string} = {};
    if (tb) params['tb'] = tb;
    return this.httpClient.post<StreamDetailsModel[]>(
      `/query`,
      {query, offset, rows},
      {
        params: Object.keys(params).length ? params : undefined,
        headers: {
          customError: 'true',
        },
      },
    );
  }

  compile(query: string, tb?: string): Observable<CompileResponse> {
    const params: {[k: string]: string} = {};
    if (tb) params['tb'] = tb;
    return this.httpClient.post<CompileResponse>(
      `/compileQuery`,
      {query},
      {
        params: Object.keys(params).length ? params : undefined,
        headers: {
          customError: 'true',
        },
      },
    );
  }

  export(query: string, format: ExportTypes, tb?: string): Observable<{id: string}> {
    const params: {[k: string]: string} = {};
    if (tb) params['tb'] = tb;
    return this.httpClient.post<{id: string}>(
      `/export-query`,
      {query, format},
      {
        params: Object.keys(params).length ? params : undefined,
        headers: {
          customError: 'true',
        },
      },
    );
  }
}
