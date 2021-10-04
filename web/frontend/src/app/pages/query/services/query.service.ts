import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StreamDetailsModel } from '../../streams/models/stream.details.model';
import { Observable } from 'rxjs';
import { SchemaTypeModel } from '../../../shared/models/schema.type.model';
import { mapTo } from 'rxjs/operators';

interface CompileResponse {
  error: string;
  errorLocation: {
    startPosition: number,
    endPosition: number,
    startLine: number,
    endLine: number
  };
}

@Injectable({
  providedIn: 'root',
})
export class QueryService {
  constructor(private httpClient: HttpClient) {
  }

  describe(query: string): Observable<{types: SchemaTypeModel[]}> {
    return this.httpClient.post<{types: SchemaTypeModel[]}>(`/describe`, { query }, {
      headers: {
        customError: 'true',
      },
    });
  }

  query(query: string, offset: number, rows: number) {
    return this.httpClient.post<StreamDetailsModel[]>(`/query`, { query, offset, rows }, {
      headers: {
        customError: 'true',
      },
    });
  }

  compile(query: string): Observable<CompileResponse> {
    return this.httpClient.post<CompileResponse>(`/compileQuery`, { query }, {
      headers: {
        customError: 'true',
      },
    });
  }
}
