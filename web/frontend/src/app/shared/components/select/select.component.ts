import {
  AfterContentInit,
  AfterViewChecked,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {ControlValueAccessor, UntypedFormControl, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ReplaySubject, Subject} from 'rxjs';
import {delay, distinctUntilChanged, map, startWith, takeUntil} from 'rxjs/operators';
import {SelectOptionDirective} from './select-option.directive';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => SelectComponent),
    },
  ],
})
export class SelectComponent
  implements OnInit, AfterContentInit, ControlValueAccessor, OnChanges, OnDestroy, AfterViewChecked
{
  @HostBinding('style.width.px') width: number;
  @Input() name: string;
  @Input() displayValue: string;
  @Input() setNull = true;
  @Output() change = new EventEmitter<string>();
  control = new UntypedFormControl();
  @ContentChildren(SelectOptionDirective) private options: QueryList<SelectOptionDirective>;
  @ViewChild('displayValueEl', {static: true}) private displayValueEl: ElementRef<HTMLDivElement>;
  private width$ = new ReplaySubject<void>(1);

  private destroy$ = new Subject();
  private viewCheckedAfterChange = false;

  ngOnChanges(changes: SimpleChanges): void {
    this.viewCheckedAfterChange = false;
    this.width$.next();
  }

  ngOnInit() {
    this.control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      if (this.setNull) {
        this.control.setValue(null, {emitEvent: false});
      }
      
      this.onChange(value);
      this.change.emit(value);
    });

    this.width$
      .pipe(
        map(() => `${this.displayValue}-${this.viewCheckedAfterChange ? '1' : '0'}`),
        distinctUntilChanged(),
        delay(0),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.countWidth();
      });
  }

  ngAfterContentInit() {
    this.options.changes.pipe(startWith(this.options)).subscribe(() => this.countWidth());
  }

  ngAfterViewChecked() {
    this.viewCheckedAfterChange = true;
    this.width$.next();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {}

  writeValue(value: string): void {
    this.control.patchValue(value, {emitEvent: false});
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private countWidth() {
    this.width = this.displayValueEl.nativeElement.offsetWidth;
  }

  private onChange(value: string) {}
}
