import { Component, OnInit, ViewChild }                 from '@angular/core';
import { UntypedFormControl }                           from '@angular/forms';
import { BsModalRef }                                   from 'ngx-bootstrap/modal';
import { Observable, of }                               from 'rxjs';
import { map, shareReplay, startWith, switchMap, take } from 'rxjs/operators';
import { StreamDescribeContentComponent }               from '../../../../../shared/components/stream-describe-content/stream-describe-content.component';
import { MenuItem }                                     from '../../../../../shared/models/menu-item';
import { StreamsService }                               from '../../../../../shared/services/streams.service';
import { copyToClipboard }                              from '../../../../../shared/utils/copy';

@Component({
  selector: 'app-modal-describe',
  templateUrl: './modal-describe.component.html',
  styleUrls: ['./modal-describe.component.scss'],
})
export class ModalDescribeComponent {
  
  @ViewChild(StreamDescribeContentComponent) private streamDescribeContentComponent: StreamDescribeContentComponent;
  
  stream: MenuItem;
  view?: {query: string};
  
  constructor(
    private bsModalRef: BsModalRef,
  ) {}
  
  onCopy() {
    this.streamDescribeContentComponent.copy().subscribe(() => this.bsModalRef.hide());
  }
}
