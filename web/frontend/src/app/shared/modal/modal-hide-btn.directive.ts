import {Directive, HostListener} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap/modal';

@Directive({
  selector: '[appModalHideBtn]',
})
export class ModalHideBtnDirective {
  constructor(private bsModalRef: BsModalRef) {}

  @HostListener('click') onClick() {
    this.bsModalRef.hide();
  }
}
