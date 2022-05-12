import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {WSService} from '../../../core/services/ws.service';
import {StreamsStateModel} from '../models/streams.state.model';

@Injectable({
  providedIn: 'root',
})
export class StreamUpdatesService {
  private updates$: Observable<StreamsStateModel>;

  constructor(private wsService: WSService) {}

  onUpdates(): Observable<StreamsStateModel> {
    if (!this.updates$) {
      this.updates$ = this.wsService
        .watch(`/topic/streams`)
        .pipe(map(({body}) => JSON.parse(body)));
    }
    return this.updates$;
  }
}
