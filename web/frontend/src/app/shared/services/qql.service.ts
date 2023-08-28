import { HttpClient }                          from '@angular/common/http';
import { Injectable }                          from '@angular/core';
import { Observable }                          from 'rxjs';
import { QueryFunction }                       from '../../pages/query/query-function';
import { SchemaAllTypeModel, SchemaTypeModel } from '../models/schema.type.model';
import { CacheRequestService }                 from './cache-request.service';

@Injectable({
  providedIn: 'root',
})
export class QqlService {
  constructor(private httpClient: HttpClient) {}

  functions(): Observable<QueryFunction[]> {
    return this.httpClient.get<QueryFunction[]>('query-info/functions-short');
  }
}
