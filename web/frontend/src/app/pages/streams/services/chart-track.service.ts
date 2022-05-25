import {Injectable, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs';
import {distinctUntilChanged, filter, map, take, takeUntil} from 'rxjs/operators';
import {TabStorageService} from '../../../shared/services/tab-storage.service';

@Injectable()
export class ChartTrackService implements OnDestroy {
  private track$ = new BehaviorSubject(null);
  private destroy$ = new ReplaySubject(1);

  constructor(private tabStorage: TabStorageService<{track: boolean}>) {
    this.tabStorage
      .getData(['track'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.track$.next(!!data?.track);
      });
  }

  track(track: boolean) {
    this.track$.next(track);
    this.tabStorage.updateData((data) => ({...data, track})).subscribe();
  }

  onTrack(): Observable<boolean> {
    return this.track$.pipe(
      filter((val) => val !== null),
      distinctUntilChanged(),
    );
  }

  value(): boolean {
    return this.track$.getValue();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
