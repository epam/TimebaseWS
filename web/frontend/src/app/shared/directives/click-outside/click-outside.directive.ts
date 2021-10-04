import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { ClickOutsideService } from './click-outside.service';
import { merge, ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[appClickOutside]',
})
export class ClickOutsideDirective implements OnInit, OnDestroy, OnChanges {

  @Input() listenClickOutside = true;
  @Output() appClickOutside = new EventEmitter<void>();

  private destroy$ = new ReplaySubject(1);
  private stopListen$ = new Subject();

  constructor(
    private clickOutsideService: ClickOutsideService,
    private elementRef: ElementRef,
  ) {
  }

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

  private listen() {
    this.stopListen$.next();
    this.clickOutsideService.onOutsideClick(this.elementRef.nativeElement).pipe(
      takeUntil(merge(this.destroy$, this.stopListen$)),
    ).subscribe(() => this.appClickOutside.emit());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
