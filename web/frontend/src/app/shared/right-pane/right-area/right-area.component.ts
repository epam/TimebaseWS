import {Component, Input, OnDestroy, OnInit, Optional} from '@angular/core';
import {SplitAreaDirective} from 'angular-split';
import {combineLatest, Observable, ReplaySubject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';
import {RightPaneService} from '../right-pane.service';

@Component({
  selector: 'app-right-area',
  templateUrl: './right-area.component.html',
  styleUrls: ['./right-area.component.scss'],
})
export class RightAreaComponent implements OnInit, OnDestroy {
  @Input() showOrderBook = true;

  showMessageInfo$: Observable<boolean>;
  showProps$: Observable<boolean>;
  showRightArea$: Observable<boolean>;

  private destroy$ = new ReplaySubject(1);

  constructor(
    private messageInfoService: RightPaneService,
    @Optional() private splitArea: SplitAreaDirective,
  ) {}

  ngOnInit(): void {
    this.showMessageInfo$ = this.messageInfoService.onShowSelectedMessage();
    this.showProps$ = this.messageInfoService.onShowProps();

    combineLatest([this.showProps$, this.showMessageInfo$])
      .pipe(map(([props, info]) => props || info))
      .pipe(takeUntil(this.destroy$))
      .subscribe((showArea) => {
        if (this.splitArea) {
          this.splitArea.visible = showArea;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
