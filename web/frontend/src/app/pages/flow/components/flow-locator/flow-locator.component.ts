import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl }                                        from '@angular/forms';
import equal                                                  from 'fast-deep-equal';
import { Observable, Subject }                                from 'rxjs';
import { auditTime, distinctUntilChanged, map, takeUntil }    from 'rxjs/operators';
import { TrafficModel }                                       from '../../models/traffic.model';
import { FlowDataService }                                    from '../../services/flow-data.service';

@Component({
  selector: 'app-flow-locator',
  templateUrl: './flow-locator.component.html',
  styleUrls: ['./flow-locator.component.scss'],
})
export class FlowLocatorComponent implements OnInit, OnDestroy {
  @Output() locate = new EventEmitter<string>();
  public controlValue = '';
  public inputControl: FormControl;
  public suggestions$: Observable<string[]>;
  private input$: Subject<string> = new Subject<string>();
  private destroy$ = new Subject<any>();

  constructor(private flowDataService: FlowDataService) {}

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.suggestions$ = this.flowDataService.getFlowDataLink$().pipe(
      map((flow: TrafficModel) => {
        return flow?.nodes?.map((node) => node.name) || [];
      }),
      distinctUntilChanged(equal),
      takeUntil(this.destroy$),
    );

    this.input$
      .pipe(auditTime(200), takeUntil(this.destroy$))
      .subscribe((searchString) => this.locate.emit(searchString));
  }

  public onModelChange(searchString: string) {
    this.input$.next(searchString);
  }

  public onClearInput() {
    this.controlValue = '';
    this.onModelChange('');
  }
}
