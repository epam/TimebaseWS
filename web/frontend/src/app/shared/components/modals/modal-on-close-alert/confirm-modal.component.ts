import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BsModalService } from 'ngx-bootstrap';
import { filter, takeUntil } from 'rxjs/operators';
import { merge, Subject } from 'rxjs';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent implements OnInit, OnDestroy {

  @Output() resolve = new EventEmitter<boolean>();

  message: string;
  destroy$ = new Subject();

  constructor(
    private bsModalRef: BsModalRef,
    private bsModalService: BsModalService,
  ) {
  }

  ngOnInit() {
    this.bsModalService.onHide.pipe(
      // In case of creation immediately after close prev modal, hide event can come later
      filter(() => !this.bsModalService.getModalsCount()),
      takeUntil(merge(this.destroy$, this.resolve)),
    ).subscribe(() => this.resolve.emit(false));
  }

  onSuccess() {
    this.resolve.emit(true);
    this.bsModalRef.hide();
  }

  ngOnDestroy() {
    this.destroy$.next();
  }
}
