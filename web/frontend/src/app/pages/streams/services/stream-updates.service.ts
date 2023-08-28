import {Injectable} from '@angular/core';
import {interval, Observable, Subject, timer, merge} from 'rxjs';
import {debounceTime, filter, map, take, takeUntil} from 'rxjs/operators';
import {WSService} from '../../../core/services/ws.service';
import {StreamsStateModel} from '../models/streams.state.model';

@Injectable({
  providedIn: 'root',
})
export class StreamUpdatesService {
  private updatesExt$ = new Subject<StreamsStateModel>();
  private emit$ = new Subject();
  private flowStarted = false;
  private accumulate = {added: [], deleted: [], changed: [], renamed: []};

  constructor(private wsService: WSService) {
    this.wsService.watchObject(`/topic/streams`).subscribe((data) => {
      ['added', 'deleted', 'changed', 'renamed'].forEach((key) => {
        const merged = [...this.accumulate[key], ...data[key]];
        this.accumulate[key] = ['added', 'deleted', 'changed'].includes(key)
          ? [...new Set(merged)]
          : merged;
      });
      if (!this.flowStarted) {
        this.flowStarted = true;
        timer(5000).subscribe(() => {
          if (this.flowStarted) {
            this.sendUpdate();
          }
        });
      }

      this.emit$.next();
      timer(500)
        .pipe(takeUntil(this.emit$))
        .subscribe(() => {
          this.sendUpdate();
        });
    });
  }

  private sendUpdate() {
    this.updatesExt$.next(this.accumulate);
    this.flowStarted = false;
    this.accumulate = {added: [], deleted: [], changed: [], renamed: []};
  }

  onUpdates(ignore = []): Observable<StreamsStateModel> {
    return this.updatesExt$.pipe(
      filter((update) => {
        const notEmpty = Object.keys(update).filter((key) => update[key].length);
        return notEmpty.filter((key) => !ignore.includes(key)).length > 0;
      }),
    );
  }
}
