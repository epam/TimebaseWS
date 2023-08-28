import {Component, OnInit} from '@angular/core';
import {UntypedFormControl, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {map} from 'rxjs/operators';
import {AppState} from '../../../../../core/store';
import {StreamsService} from '../../../../../shared/services/streams.service';
import {appRoute} from '../../../../../shared/utils/routes.names';
import {uniqueName} from '../../../../../shared/utils/validators';
import * as StreamDetailsActions from '../../../store/stream-details/stream-details.actions';

@Component({
  selector: 'app-create-stream-modal',
  templateUrl: './create-stream-modal.component.html',
})
export class CreateStreamModalComponent implements OnInit {
  streamNameControl: UntypedFormControl;

  constructor(
    private appStore: Store<AppState>,
    public bsModalRef: BsModalRef,
    private router: Router,
    private streamsService: StreamsService,
  ) {}

  ngOnInit(): void {
    const existing$ = this.streamsService
      .getList(true)
      .pipe(map((streams) => streams.map((stream) => stream.key)));
    this.streamNameControl = new UntypedFormControl(null, {
      validators: [Validators.required],
      asyncValidators: [uniqueName(existing$)],
    });
  }

  onCreateStream() {
    if (this.streamNameControl.invalid) return;
    this.bsModalRef.hide();
    this.router.navigate([appRoute, 'stream', 'stream-create', this.streamNameControl.value], {
      queryParams: {newTab: '1'},
    });
    this.appStore.dispatch(new StreamDetailsActions.RemoveErrorMessage());
  }
}
