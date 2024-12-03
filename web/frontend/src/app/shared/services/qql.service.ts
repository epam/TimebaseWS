import { HttpClient }                          from '@angular/common/http';
import { Injectable }                          from '@angular/core';
import { Observable }                          from 'rxjs';
import { QueryFunction }                       from '../../pages/query/query-function';

@Injectable({
  providedIn: 'root',
})
export class QqlService {
  constructor(private httpClient: HttpClient) {}

  functions(): Observable<QueryFunction[]> {
    return this.httpClient.get<QueryFunction[]>('query-info/functions');
  }
}
