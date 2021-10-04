import { Component, OnDestroy, OnInit } from '@angular/core';
import { BsModalRef }                   from 'ngx-bootstrap/modal';
import { select, Store } from '@ngrx/store';
import { AppState }      from '../../../../../core/store';
import { StreamModel }   from '../../../models/stream.model';
import { getStreamRange }               from '../../../store/stream-details/stream-details.selectors';
import { filter, take, takeUntil }      from 'rxjs/operators';
import { Subject }                      from 'rxjs';
import * as StreamDetailsActions        from '../../../store/stream-details/stream-details.actions';
import * as StreamsActions              from '../../../store/streams-list/streams.actions';
import { StreamsEffects }               from '../../../store/streams-list/streams.effects';

@Component({
  selector: 'app-modal-purge',
  templateUrl: './modal-purge.component.html',
  styleUrls: ['./modal-purge.component.scss'],

})
export class ModalPurgeComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject();
  public stream: StreamModel;
  public startDate: Date;
  public endDate: Date;
  public selectedDate: Date;


  constructor(
    public bsModalRef: BsModalRef,
    private appStore: Store<AppState>,
    private streamsEffects: StreamsEffects,
  ) { }

  ngOnInit() {

    this.appStore.dispatch(new StreamDetailsActions.GetStreamRange({
      streamId: this.stream.key,
    }));
    this.appStore
      .pipe(
        select(getStreamRange),
        filter(streamRange => !!streamRange),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe((streamRange) => {
        this.startDate = new Date(streamRange.start);
        this.selectedDate = new Date(streamRange.start);
        this.endDate = new Date(streamRange.end);
      });

    this.streamsEffects.closeModal
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.bsModalRef.hide());
  }

  public onPurgeSubmit() {
    this.appStore.dispatch(new StreamsActions.PurgeStream({
      streamKey: this.stream.key,
      params: {
        timestamp: this.selectedDate.getTime(),
      },
    }));
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
