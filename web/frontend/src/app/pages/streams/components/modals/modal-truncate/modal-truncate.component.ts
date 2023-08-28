import {Component, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormControl} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {Observable, Subject} from 'rxjs';
import {filter, map, take, takeUntil} from 'rxjs/operators';
import {AppState} from '../../../../../core/store';
import {MenuItem} from '../../../../../shared/models/menu-item';
import {SymbolsService} from '../../../../../shared/services/symbols.service';
import * as StreamDetailsActions from '../../../store/stream-details/stream-details.actions';
import {getStreamRange} from '../../../store/stream-details/stream-details.selectors';
import * as StreamsActions from '../../../store/streams-list/streams.actions';
import {StreamsEffects} from '../../../store/streams-list/streams.effects';

@Component({
  selector: 'app-modal-truncate',
  templateUrl: './modal-truncate.component.html',
  styleUrls: ['./modal-truncate.component.scss'],
})
export class ModalTruncateComponent implements OnInit, OnDestroy {
  stream: MenuItem;
  startDate: Date;
  endDate: Date;
  selectedDate: Date;
  dropdownSettingsSymbols = {
    idField: 'field',
    textField: 'field',
    allowSearchFilter: true,
    closeDropDownOnSelection: false,
    itemsShowLimit: 10,
  };
  selectedSymbols = [];
  symbolsList$: Observable<{id: string; name: string}[]>;
  symbolsControl = new UntypedFormControl();

  private destroy$ = new Subject();

  constructor(
    public bsModalRef: BsModalRef,
    private appStore: Store<AppState>,
    private streamsEffects: StreamsEffects,
    private symbolsService: SymbolsService,
  ) {}

  ngOnInit() {
    this.appStore.dispatch(new StreamDetailsActions.GetStreamRange({streamId: this.stream.id}));

    this.symbolsList$ = this.symbolsService
      .getSymbols(this.stream.id)
      .pipe(map((symbols) => symbols.map((s) => ({id: s, name: s}))));

    this.appStore
      .pipe(
        select(getStreamRange),
        filter((streamRange) => !!streamRange),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe((streamRange) => {
        this.startDate = new Date(streamRange.start);
        this.endDate = new Date(streamRange.end);
        this.selectedDate = new Date(streamRange.end);
      });

    this.streamsEffects.closeModal
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.bsModalRef.hide());
  }

  onSelectedSymbolsChange(symbols) {
    this.selectedSymbols = symbols;
  }

  public onTruncateSubmit() {
    const params = {timestamp: this.selectedDate.getTime()};

    if (this.symbolsControl.value?.length) {
      params['symbols'] = this.symbolsControl.value.map((symbol) => symbol.id);
    }

    this.appStore.dispatch(
      new StreamsActions.TruncateStream({
        streamKey: this.stream.id,
        params: params,
      }),
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
