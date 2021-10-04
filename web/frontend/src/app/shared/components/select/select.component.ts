import {
  AfterContentInit, AfterViewChecked,
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
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, timer } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { SelectOptionDirective } from './select-option.directive';

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
export class SelectComponent implements OnInit, AfterContentInit, ControlValueAccessor, OnChanges, OnDestroy, AfterViewChecked {
  @ContentChildren(SelectOptionDirective) private options: QueryList<SelectOptionDirective>;
  @ViewChild('selectEl', {static: true}) private selectEl: ElementRef<HTMLSelectElement>;
  @ViewChild('displayValueEl', {static: true}) private displayValueEl: ElementRef<HTMLDivElement>;

  @HostBinding('style.width.px') width: number;

  @Input() name: string;
  @Input() displayValue: string;

  @Output() change = new EventEmitter<string>();

  control = new FormControl();

  private destroy$ = new Subject();
  private countWidthOnDisplayValue = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.displayValue.previousValue !== changes.displayValue.currentValue) {
      this.countWidthOnDisplayValue = true;
    }
  }

  ngOnInit() {
    this.control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.control.setValue(null, {emitEvent: false});
      this.onChange(value);
      this.change.emit(value);
    });
  }

  ngAfterContentInit() {
    this.options.changes.pipe(startWith(this.options)).subscribe(() => this.countWidth());
  }

  ngAfterViewChecked() {
    if (this.countWidthOnDisplayValue) {
      this.countWidth();
      this.countWidthOnDisplayValue = false;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
  }

  writeValue(value: string): void {
    this.control.patchValue(value, {emitEvent: false});
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private countWidth() {
    const elements = [this.selectEl, this.displayValueEl];
    const widths = elements.map(el => el.nativeElement.offsetWidth);
    this.width = Math.max(...widths);
  }

  private onChange(value: string) {

  }
}
