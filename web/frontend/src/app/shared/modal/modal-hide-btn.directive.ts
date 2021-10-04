import { Directive, HostListener } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';

@Directive({
  selector: '[appModalHideBtn]',
})
export class ModalHideBtnDirective {

  @HostListener('click') onClick() {
    this.bsModalRef.hide();
  }

  constructor(private bsModalRef: BsModalRef) {
  }
}
