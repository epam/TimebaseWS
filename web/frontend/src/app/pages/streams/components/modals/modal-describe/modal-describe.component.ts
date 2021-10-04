import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup }                                   from '@angular/forms';
import { Observable }                                  from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { StreamDescribeModel }                         from '../../../models/stream.describe.model';
import { StreamModel }                                 from '../../../models/stream.model';
import { BsModalRef }                                  from 'ngx-bootstrap/modal';
import { select, Store }                               from '@ngrx/store';
import { AppState }                                    from '../../../../../core/store';
import * as StreamsActions                             from '../../../store/streams-list/streams.actions';
import { getLastStreamDescribe }                       from '../../../store/streams-list/streams.selectors';
import { copyToClipboard } from '../../../../../shared/utils/copy';

@Component({
  selector: 'app-modal-describe',
  templateUrl: './modal-describe.component.html',
  styleUrls: ['./modal-describe.component.scss'],
})
export class ModalDescribeComponent implements OnInit, AfterViewInit, OnDestroy {

  public renameForm: FormGroup;
  public stream: StreamModel;
  public config = {
    useBothWheelAxes: true,
  };
  public describe: Observable<StreamDescribeModel>;

  constructor(
    public bsModalRef: BsModalRef,
    private appStore: Store<AppState>,
  ) { }

  ngOnInit() {
    this.describe = this.appStore.pipe(select(getLastStreamDescribe));
  }

  ngAfterViewInit(): void {
    this.appStore.dispatch(new StreamsActions.GetStreamDescribe({streamId: this.stream.key}));
  }

  onCopy() {
    this.describe
      .pipe(switchMap(describe => copyToClipboard(describe.ddl)), take(1))
      .subscribe(() => this.bsModalRef.hide());
  }

  ngOnDestroy(): void {
    this.appStore.dispatch(new StreamsActions.SetStreamDescribe({describe: null}));
  }
}
