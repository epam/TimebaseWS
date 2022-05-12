import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {Observable} from 'rxjs';
import {switchMap, take} from 'rxjs/operators';
import {AppState} from '../../../../../core/store';
import {MenuItem} from '../../../../../shared/models/menu-item';
import {copyToClipboard} from '../../../../../shared/utils/copy';
import {StreamDescribeModel} from '../../../models/stream.describe.model';
import * as StreamsActions from '../../../store/streams-list/streams.actions';
import {getLastStreamDescribe} from '../../../store/streams-list/streams.selectors';

@Component({
  selector: 'app-modal-describe',
  templateUrl: './modal-describe.component.html',
  styleUrls: ['./modal-describe.component.scss'],
})
export class ModalDescribeComponent implements OnInit, AfterViewInit, OnDestroy {
  public renameForm: FormGroup;
  public stream: MenuItem;
  public config = {
    useBothWheelAxes: true,
  };
  public describe: Observable<StreamDescribeModel>;

  constructor(public bsModalRef: BsModalRef, private appStore: Store<AppState>) {}

  ngOnInit() {
    this.describe = this.appStore.pipe(select(getLastStreamDescribe));
  }

  ngAfterViewInit(): void {
    this.appStore.dispatch(new StreamsActions.GetStreamDescribe({streamId: this.stream.id}));
  }

  onCopy() {
    this.describe
      .pipe(
        switchMap((describe) => copyToClipboard(describe.ddl)),
        take(1),
      )
      .subscribe(() => this.bsModalRef.hide());
  }

  ngOnDestroy(): void {
    this.appStore.dispatch(new StreamsActions.SetStreamDescribe({describe: null}));
  }
}
