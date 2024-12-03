import { Component, forwardRef, OnDestroy, OnInit }             from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ReplaySubject }                                        from 'rxjs';
import { takeUntil }                         from 'rxjs/operators';
import { WriteMode }                         from './write-mode';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-write-modes-control',
  templateUrl: './write-modes-control.component.html',
  providers: [{provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => WriteModesControlComponent)}],
})
export class WriteModesControlComponent implements OnInit, ControlValueAccessor, OnDestroy {
  
  control = new FormControl<WriteMode>(null);
  writeModes = [WriteMode.append, WriteMode.insert, WriteMode.rewrite];
  toolTips: { [key: string]: string };
  
  private destroy$ = new ReplaySubject(1);

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    this.control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.onChange(value);
    });

    this.translateService.get('tooltips.writeModeTooltips').subscribe(toolTips => this.toolTips = toolTips);
  }
  
  registerOnChange(fn: (value: WriteMode) => void): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: any): void {
  }
  
  writeValue(value: WriteMode): void {
    this.control.patchValue(value, {emitEvent: false});
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private onChange(value: WriteMode) {
  }
}
