import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
}                                                        from '@angular/core';
import { FormControl }                                   from '@angular/forms';
import { select, Store }                                 from '@ngrx/store';
import { BsDatepickerConfig, BsDatepickerDirective }     from 'ngx-bootstrap';
import { Subject }                                       from 'rxjs';
import { distinctUntilChanged, filter, take, takeUntil } from 'rxjs/operators';
import { AutocompleteComponent }                         from 'src/app/libs/deltix-ng-autocomplete/src/ts/components/autocomplete.component';
import { AppState }                                      from '../../../../../../core/store';
import { getLocaleDateString }                           from '../../../../../../shared/locale.timezone';
import { hdDateTZ }                                      from '../../../../../../shared/utils/timezone.utils';
import { SimpleColumnModel }                             from '../../../../services/schema-data.service';
import { SendMessagePopupService }                       from '../../../../services/send-message-popup.service';
import { getStreamGlobalFilters }                        from '../../../../store/stream-details/stream-details.selectors';
import { fromUtc, toUtc }                                from '../../../filters-panel/filters-panel.component';

@Component({
  selector: 'app-form-control',
  template: `
    <!--    <div class="form-group flex align-items-start">-->
    <div class="controlWr d-flex">
      <label class="btn control-label" [attr.for]="control.controlName">
        {{config.headerName}}
        <strong class="text-danger" *ngIf="config.required">*</strong>
      </label>

      <ng-template [ngIf]="checkType(config.controlType, 'autocomplete')">
        <deltix-ng-autocomplete
          free="true"
          class="btn input-control"
          #autocomplete
          [id]="control.controlName"
          [(ngModel)]="autocompleteModel"
          [values]="config.controlCollection"
          [valueGetter]="autocompleteValueGetter"
          [cssClass]="'SM-autocomplete'"
          (ngModelChange)="autocompleteTriggered()"
          (click)="stopPropagation($event)"
          (changeInput)="onAutocompleteInput($event)">
        </deltix-ng-autocomplete>
      </ng-template>

      <ng-template [ngIf]="checkType(config.controlType, 'select')">
        <select [id]="control.controlName" class="btn input-control" [formControl]="control.control" (ngModelChange)="this.onSelectCHanged(config)">
          <option *ngFor="let val of config.controlCollection" [value]="val.key">{{val.title}}</option>
        </select>
      </ng-template>

      <ng-template [ngIf]="checkType(config.controlType, 'checkbox')">
        <div class="btn form-control-cb-wr">
          <label class="container-ch">
            <!--            <span class="checkbox-label"></span>-->
            <input type="checkbox"
              [id]="control.controlName"
              [formControl]="control.control">
            <span class="checkmark"></span>
          </label>
        </div>
      </ng-template>

      <ng-template [ngIf]="checkType(config.controlType, 'dateTime')">
        <input class="btn bs-datepicker datepicker-input"
          [bsConfig]="bsConfig" [id]="control.controlName" type="text" #dp="bsDatepicker"
          bsDatepicker triggers="dblclick:click" [formControl]="control.control" />
        <button class="btn btn-outline-primary erase-btn" (click)="setValue(control.control, null)" type="button" *ngIf="!config.required" [disabled]="!control.control.value">
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" class="erase-icon">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
        <button class="btn btn-navy btn-from" (click)="dp.toggle()" [attr.aria-expanded]="dp.isOpen" type="button"></button>
      </ng-template>

      <ng-template [ngIf]="checkType(config.dataType, 'ARRAY')">
        <button type="button" class="btn btn-primary btn-btn" (click)="onShowEditor(control.control)">{{'buttons.editJSON' | translate}}</button>
      </ng-template>


      <ng-template [ngIf]="checkType(config.dataType)">
        <input class="btn input-control" type="text" [id]="control.controlName" [formControl]="control.control">
      </ng-template>
    </div>
  `,
  // styleUrls: ['./form-control/form-control.component.scss']
  changeDetection: ChangeDetectionStrategy.Default,
})
export class FormControlComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject();
  public autocompleteModel: {
    key: string,
    title: string,
  };
  private autocompleteTimeout;

  @Input() control: {
    controlName: string,
    controlTitle: string,
    control: FormControl,
    type?: string,
  };

  @Input() config: SimpleColumnModel;
  @ViewChild('autocomplete') autocomplete: AutocompleteComponent;
  @ViewChild('dp') datepicker: BsDatepickerDirective;
  public bsConfig: Partial<BsDatepickerConfig>;
  public format: string;
  private filterTimezone;
  public dateVal: Date;

  private renderedLike: string;

  constructor(
    private sendMessagePopupService: SendMessagePopupService,
    private appStore: Store<AppState>,
    private CDRef: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    if (this.config && this.config.controlType === 'dateTime') {
      this.appStore
        .pipe(
          select(getStreamGlobalFilters),
          filter(global_filter => !!global_filter),
          takeUntil(this.destroy$),
          distinctUntilChanged(),
        )
        .subscribe(action => {
          let filter_date_format = getLocaleDateString();
          let filter_time_format = 'HH:mm:ss SSS';

          if (action.filter_date_format && action.filter_date_format.length) {
            filter_date_format = action.filter_date_format[0];
          }
          if (action.filter_time_format && action.filter_time_format.length) {
            filter_time_format = action.filter_time_format[0];
          }
          if (action.filter_timezone && action.filter_timezone.length) {
            this.filterTimezone = action.filter_timezone[0];
          } else {
            this.filterTimezone = null;
          }

          this.format = filter_date_format.toUpperCase() + ' ' + filter_time_format;
          this.format = this.format.replace('tt', 'A');
          this.format = this.format.replace(/f/g, 'S');
          this.bsConfig = Object.assign({}, {
            containerClass: 'theme-default',
            dateInputFormat: this.format,
          });

          // this.dateVal = this.getDateVal(this.control.control.value);
          // this.cdr.detectChanges();
        });
    }
    if (this.config && this.config.controlType === 'checkbox') {
      if (!this.control.control.value && typeof this.control.control.value !== 'boolean' && this.config.required) {
        this.setValue(this.control.control, false);
      }
    }
  }

  public checkFilterTimezoneDate(date: any) {
    if (this.filterTimezone && date) {
      const dateTimeZone = hdDateTZ(date, this.filterTimezone.name);
      return new Date(toUtc(dateTimeZone).getEpochMillis());
    }
    return new Date(fromUtc(date).getEpochMillis());
  }

  public autocompleteValueGetter(collectionItem: {
    key: string,
    title: string,
  }) {
    return collectionItem?.title;
  }

  public autocompleteTriggered(timeout: number = 400) {
    if (this.autocompleteTimeout) {
      clearTimeout(this.autocompleteTimeout);
      delete this.autocompleteTimeout;
    }
    this.autocompleteTimeout = setTimeout(() => {
      this.control.control.setValue(this.autocompleteModel.key);

      this.CDRef.detectChanges();
    }, timeout);
  }

  public onAutocompleteInput(value: string) {
    if (value) {
      this.autocompleteModel = {
        key: value,
        title: value,
      };
      this.autocompleteTriggered(1500);
    }
  }

  public checkType(config_type: string, control_type?: string): boolean {
    switch (config_type) {
      case control_type:
        if (this.renderedLike && this.renderedLike !== config_type) return false;
        this.renderedLike = config_type;
        return true;
      default:
        if (config_type && control_type && config_type.includes(control_type)) {
          if (this.renderedLike && this.renderedLike !== control_type) return false;
          this.renderedLike = control_type;
          return true;
        }
        if (config_type && !control_type) {
          if (this.renderedLike/* && this.renderedLike === config_type*/) return false;
          this.renderedLike = control_type;
          return true;
        }
    }
    return false;
  }

  public getValue(control: FormControl) {
    return control.value;
  }

  public setValue(control: FormControl, value) {
    control.setValue(value);
  }

  // updateFormValue(control: FormControl, $event: Date) {
  // const VAL = $event;
  // if (control.value !== VAL) {
  //   const NEW_DATE = this.firsDatetSet ? VAL : new Date((fromUtc((VAL as Date).toISOString())).toISOString());
  //   this.firsDatetSet = false;
  //   control.setValue(VAL);
  // }
  // }

  public getDateVal(control: FormControl) {
    return control.value;
  }

  public onShowEditor(control: FormControl) {
    this.sendMessagePopupService.onShowEditor(control.value);
    this.sendMessagePopupService.closeEditor$
      .pipe(
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe(data => control.setValue(data));
  }

  public onSelectCHanged(config: SimpleColumnModel) {
    if (config.changeEvent) config.changeEvent(this.control.control.value);
  }

  public autocompleteClickOutsideListener(/*$event: Event*/) {
    if (this.autocomplete) {
      this.autocomplete.showDropdown = false;
      setTimeout(() => {
        if (!this.CDRef['destroyed']) {
          this.CDRef.detectChanges();
        }
      }, 50);
    }
  }

  public stopPropagation($event: Event) {
    $event.stopPropagation();
    $event.stopImmediatePropagation();
  }

  ngAfterViewInit(): void {
    if (this.config && this.config.controlType === 'autocomplete') {

      if (this.control.control.value) {
        const val = this.control.control.value;
        this.autocompleteModel = {
          key: val,
          title: val,
        };
        this.autocompleteTriggered(50);
        setTimeout(() => {
          if (!this.CDRef['destroyed']) {
            this.CDRef.detectChanges();
          }
        }, 100);
      }
      document.addEventListener('close_autocomplete', this.autocompleteClickOutsideListener.bind(this));
    }
  }

  ngOnDestroy(): void {
    this.CDRef.detach();
    this.destroy$.next(true);
    this.destroy$.complete();
    document.removeEventListener('close_autocomplete', this.autocompleteClickOutsideListener.bind(this));
  }
}
