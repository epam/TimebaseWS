import {Component, OnInit} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {SchemaClassFieldModel} from '../../../../../../shared/models/schema.class.type.model';

@Component({
  selector: 'app-relative-to-modal',
  templateUrl: './relative-to-modal.component.html',
  styleUrls: ['./relative-to-modal.component.scss'],
})
export class RelativeToModalComponent {
  blockFields: SchemaClassFieldModel[];
  isFloat: boolean;
  fieldName: string;

  resolve$ = new Subject<boolean>();

  constructor(private bsModalRef: BsModalRef) {}

  discard() {
    this.resolve$.next(false);
    this.bsModalRef.hide();
  }

  clear() {
    this.resolve$.next(true);
    this.bsModalRef.hide();
  }
}
