import {Component, EventEmitter, OnDestroy, OnInit, Output, TemplateRef} from '@angular/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {merge, Subject} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
})
export class ConfirmModalComponent implements OnInit, OnDestroy {
  @Output() resolve = new EventEmitter<boolean>();

  message: string;
  messageTpl: TemplateRef<HTMLElement>;
  destroy$ = new Subject();
  withoutHeader = false;
  btns = {
    yes: 'buttons.yes',
    no: 'buttons.no',
  };

  constructor(private bsModalRef: BsModalRef, private bsModalService: BsModalService) {}

  ngOnInit() {
    this.bsModalService.onHide
      .pipe(
        // In case of creation immediately after close prev modal, hide event can come later
        filter(() => !this.bsModalService.getModalsCount()),
        takeUntil(merge(this.destroy$, this.resolve)),
      )
      .subscribe(() => this.resolve.emit(false));
  }

  onSuccess() {
    this.resolve.emit(true);
    this.bsModalRef.hide();
  }

  ngOnDestroy() {
    this.destroy$.next();
  }
}
