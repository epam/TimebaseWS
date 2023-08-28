import { Directive, ElementRef, OnInit } from '@angular/core';
import { timer }                         from 'rxjs';

@Directive({
  selector: '[appAutofocus]',
})
export class AutofocusDirective implements OnInit {
  constructor(private elementRef: ElementRef) {
  }
  
  ngOnInit(): void {
    timer().subscribe(() => this.elementRef.nativeElement.focus());
  }
}
