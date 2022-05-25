import {Directive, HostBinding, OnDestroy, OnInit} from '@angular/core';
import {MultiSelectComponent} from 'ng-multiselect-dropdown';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Directive({
  selector: '[appMultiselectNormalize]',
})
export class MultiselectNormalizeDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject();

  @HostBinding('class.single-selection') private singleSelection = true;

  constructor(private multiSelectComponent: MultiSelectComponent) {}

  ngOnInit(): void {
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
