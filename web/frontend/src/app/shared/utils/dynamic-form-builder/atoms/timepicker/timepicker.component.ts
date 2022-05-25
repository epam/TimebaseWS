import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {HdDate} from '@assets/hd-date/hd-date';
import {BsDatepickerConfig, BsDatepickerDirective} from 'ngx-bootstrap/datepicker';
import {toUtc} from '../../../../../pages/streams/components/stream-details/stream-details.component';

@Component({
  selector: 'app-timepicker',
  templateUrl: './timepicker.component.html',
  styleUrls: ['./timepicker.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class TimepickerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() field: any = {};
  @Input() form: FormGroup;
  public visibleSelectedDate: Date;
  public bsConfig: Partial<BsDatepickerConfig>;
  @ViewChild('dp') datepicker: BsDatepickerDirective;
  private control: FormControl;
  private bsDefaultConfig: Partial<BsDatepickerConfig> = {
    containerClass: 'theme-default',
    adaptivePosition: true,
    dateInputFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
  };
  private setByApp;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.control = this.form.get(this.field.name) as FormControl;
    this.bsConfig = {
      ...this.bsDefaultConfig,
      ...(this.field._controlSpecOptions || {}),
    };
  }

  ngAfterViewInit(): void {
    this.updatePickerDate();
  }

  public onValueChange(newDate: Date) {
    if (this.setByApp) {
      this.setByApp = false;
      return;
    }

    if (!newDate) {
      return;
    }

    const SELECTED_UTC_DATE = toUtc(newDate.getTime()).toLocaleFormat(
      this.bsDefaultConfig.dateInputFormat.replace(/Y/g, 'y').replace(/D/g, 'd'),
      'en-US',
    );

    this.control.setValue(SELECTED_UTC_DATE);
  }

  public onInput() {
    this.updatePickerDate(true);
  }

  public dpToggle(event: Event) {
    // event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.datepicker.toggle();
  }

  ngOnDestroy(): void {
    this.cdr.detach();
  }

  private updatePickerDate(silent?: boolean) {
    setTimeout(() => {
      if (this.control.valid) {
        if (this.control.value) {
          this.setByApp = true;
          this.visibleSelectedDate = this.getDateWithoutSelectedTZ(new Date(this.control.value));
        }
        if (!silent) {
          this.datepicker.setConfig();
          this.cdr.detectChanges();
        }
      }
    }, 15);
  }

  private getDateWithoutSelectedTZ(date: Date, offset = 0): Date {
    const newDate = new Date(date.getTime()),
      localOffset = -new HdDate().getTimezoneOffset();
    newDate.setMilliseconds(newDate.getMilliseconds() - (offset - localOffset) * 60 * 1000);
    return newDate;
  }
}
