import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ExportTypes} from '../../../shared/models/grid-data-store.model';
import {SchemaTypeModel} from '../../../shared/models/schema.type.model';
import {StreamDetailsModel} from '../../streams/models/stream.details.model';

interface CompileResponse {
  error: string;
  errorLocation: {
    startPosition: number;
    endPosition: number;
    startLine: number;
    endLine: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class QueryService {
  constructor(private httpClient: HttpClient) {}

  describe(query: string): Observable<{types: SchemaTypeModel[]; all: SchemaTypeModel[]}> {
    return this.httpClient.post<{types: SchemaTypeModel[]; all: SchemaTypeModel[]}>(
      `/describe`,
      {query},
      {
        params: {
          tree: 'true',
        },
        headers: {
          customError: 'true',
        },
      },
    );
  }

  query(query: string, offset: number, rows: number) {
    return this.httpClient.post<StreamDetailsModel[]>(
      `/query`,
      {query, offset, rows},
      {
        headers: {
          customError: 'true',
        },
      },
    );
  }

  compile(query: string): Observable<CompileResponse> {
    return this.httpClient.post<CompileResponse>(
      `/compileQuery`,
      {query},
      {
        headers: {
          customError: 'true',
        },
      },
    );
  }

  export(query: string, format: ExportTypes): Observable<{id: string}> {
    return this.httpClient.post<{id: string}>(
      `/export-query`,
      {query, format},
      {
        headers: {
          customError: 'true',
        },
      },
    );
  }
}
