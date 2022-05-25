import {Component, OnInit} from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {map} from 'rxjs/operators';
import {AppState} from '../../../../../core/store';
import {StreamsService} from '../../../../../shared/services/streams.service';
import {appRoute} from '../../../../../shared/utils/routes.names';
import {uniqueName} from '../../../../../shared/utils/validators';

@Component({
  selector: 'app-create-stream-modal',
  templateUrl: './create-stream-modal.component.html',
  styleUrls: ['./create-stream-modal.component.css'],
})
export class CreateStreamModalComponent implements OnInit {
  streamNameControl: FormControl;

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
    this.streamNameControl = new FormControl(null, {
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
  }
}
