import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {TimebaseInstanceDef} from '../models/timebase-instance-def.model';

@Injectable({
  providedIn: 'root',
})
export class TimebasesService {
  constructor(private httpClient: HttpClient) {}

  getTimebases(): Observable<TimebaseInstanceDef[]> {
    return this.httpClient.get<TimebaseInstanceDef[]>('/timebases');
  }
}
