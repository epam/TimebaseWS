import {Directive, ElementRef, HostListener, Optional} from '@angular/core';
import {NgControl} from '@angular/forms';

@Directive({
  selector: '[appNumbersOnly]',
})
export class NumbersOnlyDirective {
  private prohibited = /[^\d]/g;

  constructor(private elementRef: ElementRef, @Optional() private ngControl: NgControl) {}

  @HostListener('input', ['$event']) input(event: InputEvent) {
    const input = event.target as HTMLInputElement;
    const clear = input.value.replace(this.prohibited, '');
    this.ngControl?.control.patchValue(clear);
    input.value = clear;
  }
}
