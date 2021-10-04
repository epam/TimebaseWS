import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit }       from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators }           from '@angular/forms';
import { HdDate }                                                        from '@assets/hd-date/hd-date';
import { select, Store }                                                 from '@ngrx/store';
import { BsModalRef }                                                    from 'ngx-bootstrap/modal';
import { Subject }                                                       from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { AppState }                                                      from '../../../../../core/store';
import { fromUtc, toUtc }                                                from '../../../../../shared/locale.timezone';
import { SchemaClassTypeModel }                                          from '../../../../../shared/models/schema.class.type.model';
import {
  dateToUTC,
  hdDateTZ,
}                                                                        from '../../../../../shared/utils/timezone.utils';
import { StreamDetailsModel }                                            from '../../../models/stream.details.model';
import { StreamModel }                                                   from '../../../models/stream.model';
import { SchemaDataService, SimpleColumnModel }                          from '../../../services/schema-data.service';
import { SendMessagePopupService }                                       from '../../../services/send-message-popup.service';
import { getStreamGlobalFilters }                                        from '../../../store/stream-details/stream-details.selectors';
import * as StreamsActions
                                                                         from '../../../store/streams-list/streams.actions';

@Component({
  selector: 'app-modal-send-message',
  templateUrl: './modal-send-message.component.html',
  styleUrls: ['./modal-send-message.component.scss'],
})
export class ModalSendMessageComponent implements OnInit, AfterViewInit, OnDestroy {

  public renameForm: FormGroup;
  public stream: StreamModel;
  private destroy$ = new Subject();
  private timestamp: string;
  public commonMessageForm: FormGroup;
  public messageForm: FormGroup;
  private messageFormDestroy$: Subject<boolean> = new Subject();
  private commonMessageFormdDestroy$: Subject<boolean> = new Subject();
  public showEditor = false;
  public simpleConfig: SimpleColumnModel[];
  public commonSimpleConfig: SimpleColumnModel[];
  private allConfig: SchemaClassTypeModel[];
  public formData?: any;
  public editorData;
  public editorOptions = {
    theme: 'vs-dark', language: 'json', automaticLayout: true,
  };
  public editor;

  private filterTimezone;

  constructor(
    public bsModalRef: BsModalRef,
    private appStore: Store<AppState>,
    private schemaDataService: SchemaDataService,
    private sendMessagePopupService: SendMessagePopupService,
    private fb: FormBuilder,
    private elRef: ElementRef,
  ) { }

  ngOnInit(): void {
    if (this.stream) {
      this.schemaDataService
        .getSchema(this.stream.key)
        .pipe(
          switchMap(([allConfig, simpleConfig]: [SchemaClassTypeModel[], SimpleColumnModel[]]) => {
            this.allConfig = allConfig;
            return this.schemaDataService
              .getSymbols(this.stream.key)
              .pipe(
                map((symbols: string[]) => ([simpleConfig, symbols])),
              );
          }),
          take(1),
          takeUntil(this.destroy$),
        )
        .subscribe(([simpleConfig, symbols]: [SimpleColumnModel[], string[]]) => {
          this.commonSimpleConfig = [
            {
              headerName: 'Symbol',
              field: 'symbol',
              headerTooltip: 'Symbol',
              required: true,
              controlType: 'autocomplete',
              controlCollection: symbols.map((symbol): {
                key: string,
                title: string,
              } => {
                return {
                  key: symbol,
                  title: symbol,
                };
              }),
            },
            {
              headerName: 'Type',
              field: '$type',
              headerTooltip: 'Type',
              required: true,
              controlType: 'select',
              controlCollection: this.get$TypeCollection(simpleConfig),
              changeEvent: (value: string) => {

                if (value) {
                  const key = this.commonMessageForm.get('$type').value;
                  const S_CONFIG = simpleConfig.find(config => config.field === key);

                  this.messageForm = this.generateForm([this.addPackageTypes(S_CONFIG)], this.messageFormDestroy$);
                }
                if (this.formData) {
                  const {symbol, timestamp, $type, ...messageFormData} = this.formData;
                  this.messageForm.reset(messageFormData/*[value]*/);
                }
              },
            },
            {
              headerName: 'Timestamp',
              field: 'timestamp',
              headerTooltip: 'Timestamp',
              required: false,
              // dataType: 'TIMESTAMP',
              controlType: 'dateTime',
            },
          ];
          this.simpleConfig = simpleConfig;
          this.commonMessageForm = this.generateForm(this.commonSimpleConfig, this.commonMessageFormdDestroy$);
          const $TYPE_FIELD = this.commonSimpleConfig.find(config => config.field === '$type');
          const SYMBOL_FIELD = this.commonSimpleConfig.find(config => config.field === 'symbol');

          if (this.commonMessageForm.get('$type')) {
            this.commonMessageForm.get('$type').setValue($TYPE_FIELD.controlCollection.length && $TYPE_FIELD.controlCollection[0] ? $TYPE_FIELD.controlCollection[0].key : null);
          }
          if (this.commonMessageForm.get('symbol')) {
            this.commonMessageForm.get('symbol').setValue(SYMBOL_FIELD.controlCollection.length && SYMBOL_FIELD.controlCollection[0] ? SYMBOL_FIELD.controlCollection[0].key : null);
          }

          // let TIMESTAMP;
          if (this.formData) {
            this.setFormData(this.formData);
          } else {
            if (this.commonMessageForm.get('$type') && $TYPE_FIELD.controlCollection.length && $TYPE_FIELD.controlCollection[0]) {
              const key = $TYPE_FIELD.controlCollection[0].key,
                S_CONFIG = simpleConfig.find(config => config.field === key);
              this.messageForm = this.generateForm([this.addPackageTypes(S_CONFIG)], this.messageFormDestroy$);
            }
          }


          this.appStore
            .pipe(
              select(getStreamGlobalFilters),
              filter(global_filter => !!global_filter),
              takeUntil(this.destroy$),
              distinctUntilChanged(),
            )
            .subscribe(action => {
              if (action.filter_timezone && action.filter_timezone.length) {
                this.filterTimezone = action.filter_timezone[0];
              } else {
                this.filterTimezone = null;
              }
              let UTCTIME, TIME;
              if (this.timestamp) {
                TIME = new Date(this.timestamp).toISOString();
                UTCTIME = new HdDate(TIME);
              } else {
                // TIME = new Date(CONTROL.value).toISOString();
                UTCTIME = new HdDate();
              }
              TIME = this.checkFilterTimezoneDate(UTCTIME);
              this.commonMessageForm.get('timestamp').setValue(TIME);
            });
        });

    }
  }

  private addPackageTypes(config: SimpleColumnModel): SimpleColumnModel {
    if (this.allConfig && config.children && config.children.length) {
      for (const CHILD of config.children) {
        const CHILD_TYPE = this.allConfig.find(type => type.name === CHILD.dataType);
        if (CHILD_TYPE && CHILD_TYPE && CHILD_TYPE.isEnum) {
          CHILD.controlType = 'select';
          CHILD.controlCollection = CHILD_TYPE.fields.map(field => ({key: field.name, title: field.title}));
        }
      }
    }
    return config;
  }

  private setFormData(data) {
    let key;
    const simpleConfig = this.simpleConfig;
    const {symbol, timestamp, $type, ...messageFormData} = data;
    this.timestamp = timestamp;
    this.commonMessageForm.reset({symbol, $type: $type.replace(/\./g, '-'), timestamp});
    if (this.commonMessageForm.get('$type') && this.commonMessageForm.get('$type').value) {
      key = this.commonMessageForm.get('$type').value;
    } else {
      key = (this.commonSimpleConfig.find(config => config.field === '$type')).controlCollection[0].key;
    }
    const S_CONFIG = simpleConfig.find(config => config.field === key);
    this.messageForm = this.generateForm([this.addPackageTypes(S_CONFIG)], this.messageFormDestroy$);
    this.messageForm.reset(messageFormData);

  }

  private get$TypeCollection(simpleConfig: SimpleColumnModel[]): {
    key: string,
    title: string,
  }[] {
    return Object.values(simpleConfig).map(entry => ({
      key: entry.field,
      title: entry.headerName,
    }));
  }

  private generateForm(simpleConfig: SimpleColumnModel[], subject?: Subject<boolean>): FormGroup {
    const FORM_GROUP = {};
    simpleConfig.forEach(config => {
      if (!config.children) {
        if (config.controlType === 'select') {
          FORM_GROUP[config.field.replace(/\./g, '-')] = [config.controlCollection[0], config.required ? [Validators.required] : []];
        } else {
          FORM_GROUP[config.field.replace(/\./g, '-')] = [null, config.required ? [Validators.required] : []];
        }
      } else {
        FORM_GROUP[config.field.replace(/\./g, '-')] = this.generateForm(config.children);
      }
    });
    const FORM = this.fb.group({...FORM_GROUP});

    if (subject) {
      subject.next(true);
      subject.complete();
      subject = new Subject<boolean>();
      FORM.valueChanges
        .pipe(
          takeUntil(subject),
          takeUntil(this.destroy$),
        )
        .subscribe((/*value*/) => {
          this.convertDateData(simpleConfig, FORM);
        });
    }
    return FORM;
  }

  private convertDateData(simpleConfig: SimpleColumnModel[], formGroup: AbstractControl) {
    if (!formGroup) return;
    simpleConfig.forEach(config => {
      if (config.children && config.children.length) {
        this.convertDateData(config.children, formGroup.get(config.field.replace(/\./g, '-')));
      } else {
        if (config.controlType === 'dateTime') {
          const CONTROL = formGroup.get(config.field);
          if (CONTROL) {
            const VALUE = CONTROL.value;
            if (typeof VALUE === 'string') {
              let UTCTIME, TIME;
              if (VALUE) {
                TIME = (new Date(VALUE)).toISOString();
                UTCTIME = new HdDate(TIME);
                TIME = this.checkFilterTimezoneDate(UTCTIME);
                CONTROL.setValue(TIME);
              }
            }
          }
        }
      }
    });
  }

  private convertToMSG({symbol, timestamp, $type, ...messages}) {
    let data: StreamDetailsModel;
    const CONVERTED_DATA = Object.keys(messages)
      .filter(key => {
        const message = messages[key];
        let allow = false;
        for (const i in message) {
          if (!allow && message.hasOwnProperty(i)) {
            if (message[i] !== null) {
              allow = true;
            }
          } else {
            break;
          }
        }
        return allow;
      })
      .map((key: string) => {
        const msg = {};
        Object.keys(messages[key]).forEach(msg_prop_key => {
          if (messages[key][msg_prop_key] !== null) {
            msg[msg_prop_key] = messages[key][msg_prop_key];
          }
        });
        return {
          $type: key.replace(/-/g, '.'),
          symbol: symbol,
          timestamp: timestamp,
          ...msg,
        };
      });
    if (CONVERTED_DATA && CONVERTED_DATA.length) {
      data = CONVERTED_DATA[0];
    } else {
      data = new StreamDetailsModel({});
      if ($type) data.$type = $type;
      if (symbol) data.symbol = symbol;
      if (timestamp) data.timestamp = timestamp;
    }
    return data;
  }


  private checkFilterTimezoneDate(date: any) {
    let DATE;
    if (this.filterTimezone && date) {
      const dateTimeZone = hdDateTZ(date, this.filterTimezone.name);
      DATE = new Date(toUtc(dateTimeZone).getEpochMillis());
    } else {
      DATE = new Date(fromUtc(date).getEpochMillis());
    }
    return DATE;

  }

  private getFormValue(ignoreValidation?: boolean) {
    const VALUE = {
      ...this.messageForm.value,
      ...this.commonMessageForm.value,
    };
    if (!VALUE ||
      (this.messageForm.invalid && !ignoreValidation) ||
      (this.commonMessageForm.invalid && !ignoreValidation)
    ) {
      return;
    } else if (!ignoreValidation) {
      this.messageForm.markAllAsTouched();
      this.commonMessageForm.markAllAsTouched();
    }

    if (VALUE.timestamp) {
      if (this.filterTimezone) {
        VALUE.timestamp = (dateToUTC(VALUE.timestamp, this.filterTimezone.name)).toISOString();
      } else {
        VALUE.timestamp = VALUE.timestamp.toISOString();
      }
    }
    return VALUE;
  }

  public onMessageFormSubmit() {

    const CONVERTED_DATA = [this.convertToMSG(this.getFormValue())];
    this.appStore.dispatch(new StreamsActions.SendMessage({
      streamId: this.stream.key,
      messages: CONVERTED_DATA,
    }));
  }

  ngAfterViewInit(): void {
    this.sendMessagePopupService.showEditor$
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe(data => {
        this.showEditor = true;
        this.editorData = JSON.stringify(data);

        setTimeout(() => {
          if (this.editor && this.editor.getAction) this.editor.getAction('editor.action.formatDocument').run();
        }, 100);
      });

    const bsModalBackdrop = this.getParentByTag(this.elRef.nativeElement, 'modal-container');
    if (bsModalBackdrop) {
      bsModalBackdrop.addEventListener('click', () => {
        this.clickListener();
      });
    }
  }

  clickListener() {
    document.dispatchEvent((new Event('close_autocomplete')));
  }

  onEditorInit(editor) {
    this.editor = editor;
  }

  public onCloseEditor() {
    try {
      this.sendMessagePopupService.onEditorIsClosed(JSON.parse(this.editorData || 'null'));
    } catch (err) {
      return;
    }
    this.showEditor = false;
  }

  public onShowEditor() {
    const VALUE = this.getFormValue(true);
    this.sendMessagePopupService.onShowEditor(VALUE);
    this.sendMessagePopupService.closeEditor$
      .pipe(
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe(data => this.setFormValue(data));
  }

  private setFormValue(data) {
    this.setFormData(data);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

    const bsModalBackdrop = this.getParentByTag(this.elRef.nativeElement, 'modal-container');
    if (bsModalBackdrop) {
      bsModalBackdrop.removeEventListener('click', this.clickListener);
    }
  }

  private getParentByTag(htmlEl: HTMLElement, tagName: string) {
    const PARENT = htmlEl.parentElement;
    if (PARENT && PARENT.tagName.toLocaleLowerCase() !== tagName.toLocaleLowerCase()) {
      return this.getParentByTag(PARENT, tagName);
    } else if (PARENT && PARENT.tagName.toLocaleLowerCase() === tagName.toLocaleLowerCase()) {
      return PARENT;
    } else if (htmlEl && htmlEl.tagName.toLocaleLowerCase() === tagName.toLocaleLowerCase()) {
      return htmlEl;
    }
    return null;
  }

}
