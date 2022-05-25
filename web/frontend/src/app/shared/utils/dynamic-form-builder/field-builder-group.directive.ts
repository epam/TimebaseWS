import {Directive, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';

@Directive({
  selector: '[appFieldBuilderGroup]',
})
export class FieldBuilderGroupDirective implements OnChanges {
  @Input() appFieldBuilderGroup: object[];

  private minWidth = 0;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  setLabelWidth(width: number) {
    this.minWidth = Math.max(this.minWidth, width);
    this.elementRef.nativeElement.style.setProperty('--label-min-width', `${this.minWidth}px`);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.minWidth = 0;
  }
}
