import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {BehaviorSubject, Subject} from 'rxjs';
import {filter, take, takeUntil} from 'rxjs/operators';
import {AppState} from '../../../../../core/store';
import {MenuItem} from '../../../../../shared/models/menu-item';
import * as StreamDetailsActions from '../../../store/stream-details/stream-details.actions';
import {getStreamRange} from '../../../store/stream-details/stream-details.selectors';
import * as StreamsActions from '../../../store/streams-list/streams.actions';
import {StreamsEffects} from '../../../store/streams-list/streams.effects';

@Component({
  selector: 'app-modal-purge',
  templateUrl: './modal-purge.component.html',
  styleUrls: ['./modal-purge.component.scss'],
})
export class ModalPurgeComponent implements OnInit, OnDestroy {
  public stream: MenuItem;
  public startDate: Date;
  public endDate: Date;
  public selectedDate: Date;
  public submitDisabled$ = new BehaviorSubject(true);
  public validationErrorMessage = '';
  private dateValue: Date;
  private destroy$ = new Subject();

  constructor(
    public bsModalRef: BsModalRef,
    private appStore: Store<AppState>,
    private streamsEffects: StreamsEffects,
  ) {}

  ngOnInit() {   
    this.appStore.dispatch(
      new StreamDetailsActions.GetStreamRange({
        streamId: this.stream.id,
        tbId: this.stream.tbId,
      }),
    );
    this.appStore
      .pipe(
        select(getStreamRange),
        filter((streamRange) => !!streamRange),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe((streamRange) => {
        this.startDate = new Date(streamRange.start);
        this.selectedDate = new Date(streamRange.start);
        this.endDate = new Date(streamRange.end);
      });

    this.streamsEffects.closeModal
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.bsModalRef.hide());
  }

  public onPurgeSubmit() {
    this.appStore.dispatch(
      new StreamsActions.PurgeStream({
        streamKey: this.stream.id,
        tbId: this.stream.tbId,
        params: {
          timestamp: this.dateValue.getTime(),
        },
      }),
    );
  }

  selectedDateChange(date: Date) {
    this.dateValue = date;
    this.submitDisabled$.next(date?.toString() === 'Invalid Date');
    this.validationErrorMessage = date?.toString() === 'Invalid Date' ? 'Invalid Date' : '';
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
