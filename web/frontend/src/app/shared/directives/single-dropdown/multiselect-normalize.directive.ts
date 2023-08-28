import { ChangeDetectorRef, Directive, HostBinding, Inject, OnDestroy, OnInit, Optional, Self } from '@angular/core';
import { NgControl }                                                                            from '@angular/forms';
import { MultiSelectComponent }                                                                 from 'ng-multiselect-dropdown';
import { Subject }                                                                              from 'rxjs';
import { startWith, takeUntil }                                                                 from 'rxjs/operators';

@Directive({
  selector: '[appMultiselectNormalize]',
})
export class MultiselectNormalizeDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject();
  
  @HostBinding('class.single-selection') private singleSelection = true;
  @HostBinding('class.has-values') private hasValues = false;
  
  constructor(
    private multiSelectComponent: MultiSelectComponent,
    private cdRef: ChangeDetectorRef,
    @Optional() @Self() @Inject(NgControl) private ngControl: NgControl,
  ) {}
  
  ngOnInit(): void {
    this.ngControl.control?.valueChanges.pipe(startWith(this.ngControl.control?.value), takeUntil(this.destroy$)).subscribe((data) => {
      this.hasValues = !!data?.length;
      this.cdRef.detectChanges();
    });
    this.multiSelectComponent.onDeSelect.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      if (this.multiSelectComponent._settings.singleSelection) {
        this.multiSelectComponent.writeValue([value]);
        this.multiSelectComponent.closeDropdown();
      }
    });
    this.multiSelectComponent.onSelect.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.multiSelectComponent._settings.singleSelection) {
        this.multiSelectComponent.closeDropdown();
      }
    });
    
    this.singleSelection = this.multiSelectComponent._settings.singleSelection;
    
    // Multiselect close dropdown on touch action and emit it on blur
    this.multiSelectComponent.onTouched = () => {
      const callback = this.multiSelectComponent['onTouchedCallback'];
      if (callback) {
        callback();
      }
    };
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
