import { HdDate }                                                         from '@assets/hd-date/hd-date';
import { Observable, Subject }                                            from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, take, takeUntil } from 'rxjs/operators';

export class StreamRangeModel {
  public start: number;

  private _end?: number;
  private _dateUpdateAction?: () => void;
  private getSubject$?: Subject<boolean> = new Subject<boolean>();
  private destroyObserver$?: Subject<boolean> = new Subject();


  constructor(obj: StreamRangeModel) {
    Object.assign(this, obj);
  }

  set end(end_number: number) {
    this._end = end_number;
  }

  get end() {
    this.updateEndDate();
    return this._end;
  }

  set dateUpdateAction(action: () => void) {
    this._dateUpdateAction = action;
  }

  get dateUpdateAction() {
    return null;
  }

  set datesObserver(observer: Observable<{ end: string, start: string } | null>) {
    if (this.destroyObserver$) {
      this.destroyObserver$.next(true);
      this.destroyObserver$.complete();
      this.destroyObserver$ = new Subject();
    }
    if (this.getSubject$) {
      this.getSubject$.complete();
      delete this.getSubject$;
      this.getSubject$ = new Subject<boolean>();
    }
    this.getSubject$
      .pipe(
        debounceTime(1000),
        switchMap(() => {
          return observer
            .pipe(
              distinctUntilChanged(),
              take(1),
            );
        }),
        takeUntil(this.destroyObserver$),
      )
      .subscribe(({end, start}: { end: string, start: string }) => {
        this._end = (new HdDate(end)).getEpochMillis();
      });
  }

  get datesObserver() {
    return null;
  }


  private updateEndDate?() {
    if (this._dateUpdateAction) {
      this._dateUpdateAction();
      this.getSubject$.next(true);
    }
  }
}
