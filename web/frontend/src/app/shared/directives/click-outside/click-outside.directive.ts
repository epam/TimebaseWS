import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {merge, ReplaySubject, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ClickOutsideService} from './click-outside.service';

@Directive({
  selector: '[appClickOutside]',
})
export class ClickOutsideDirective implements OnInit, OnDestroy, OnChanges {
  @Input() listenClickOutside = true;
  @Output() appClickOutside = new EventEmitter<void>();

  private destroy$ = new ReplaySubject(1);
  private stopListen$ = new Subject();

  constructor(private clickOutsideService: ClickOutsideService, private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.listen();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.listenClickOutside.currentValue) {
      this.stopListen$.next();
    } else {
      this.listen();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private listen() {
    this.stopListen$.next();
    this.clickOutsideService
      .onOutsideClick(this.elementRef.nativeElement)
      .pipe(takeUntil(merge(this.destroy$, this.stopListen$)))
      .subscribe(() => this.appClickOutside.emit());
  }
}
