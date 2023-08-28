import {Component, Input, OnDestroy, OnInit, Optional} from '@angular/core';
import {SplitAreaDirective} from 'angular-split';
import { Observable, ReplaySubject} from 'rxjs';
import { takeUntil} from 'rxjs/operators';
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
  showChartSettings$: Observable<boolean>;
  showDescription$: Observable<boolean>;

  private destroy$ = new ReplaySubject(1);

  constructor(
    private rightPaneService: RightPaneService,
    @Optional() private splitArea: SplitAreaDirective,
  ) {}

  ngOnInit(): void {
    this.showMessageInfo$ = this.rightPaneService.onShowSelectedMessage();
    this.showProps$ = this.rightPaneService.onShowProps();
    this.showChartSettings$ = this.rightPaneService.onShowChartSettings();
    this.showDescription$ = this.rightPaneService.onShowDescription();
  
    this.rightPaneService.onShowAny()
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
