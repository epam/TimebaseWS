import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store }                from '@ngrx/store';
import { Observable, Subject }          from 'rxjs';
import { isArray }                      from 'rxjs/internal-compatibility';
import { map, take }                    from 'rxjs/operators';
import { AppState }                     from '../../../../../../core/store';
import { StreamDetailsModel }           from '../../../../models/stream.details.model';
import { TabSettingsModel }             from '../../../../models/tab.settings.model';
import { CleanSelectedMessage }         from '../../../../store/seletcted-message/selected-message.actions';
import { getSelectedMessage }           from '../../../../store/seletcted-message/selected-message.selectors';
import * as StreamsTabsActions
                                        from '../../../../store/streams-tabs/streams-tabs.actions';
import { getActiveTabSettings }         from '../../../../store/streams-tabs/streams-tabs.selectors';

@Component({
  selector: 'app-message-info',
  templateUrl: './message-info.component.html',
  styleUrls: ['./message-info.component.scss'],
})
export class MessageInfoComponent implements OnInit, OnDestroy {
  selectedMessage$: Observable<StreamDetailsModel>;
  tabSettings$: Observable<TabSettingsModel>;
  btnText$: Observable<string>;
  showJson$: Observable<boolean>;
  props$: Observable<{ key: string, value: string }[]>;
  editorOptions = {
    theme: 'vs-dark',
    language: 'json',
    automaticLayout: true,
    codeLens: false,
    minimap: {enabled: false},
  };
  editorValue$: Observable<string>;
  
  private destroy$ = new Subject();
  
  constructor(
    private appStore: Store<AppState>,
  ) { }
  
  ngOnInit() {
    this.tabSettings$ = this.appStore.pipe(select(getActiveTabSettings));
    this.showJson$ = this.tabSettings$.pipe(map(settings => settings.messageJSONType));
    this.btnText$ = this.showJson$.pipe(
      map(json => `buttons.${json ? 'msgShowSimpleView' : 'msgShowJSONView'}`),
    );
    this.selectedMessage$ = this.appStore.pipe(select(getSelectedMessage));
    this.props$ = this.selectedMessage$.pipe(map(message => this.getProps(message)));
    this.editorValue$ = this.selectedMessage$.pipe(map(message => JSON.stringify(message, null, '\t')));
  }
  
  private getProps(message: StreamDetailsModel) {
    if (!message) {
      return [];
    }
    
    const MSG_ARRAY = [];
    Object.keys(message).forEach(msgKey => {
      const PROP = message[msgKey],
        MSG: { key: string, value?: string } = {
          key: msgKey,
        };
      if (typeof PROP === 'object') {
        MSG.value = '';
        Object.keys(PROP).forEach(childPropKey => {
          if (typeof PROP[childPropKey] === 'object') {
            MSG_ARRAY.push({
              key: childPropKey,
              value: JSON.stringify(PROP[childPropKey]),
            });
          } else {
            MSG_ARRAY.push({
              key: childPropKey,
              value: PROP[childPropKey],
            });
          }
        });
      } else if (isArray(PROP)) {
        MSG.value = JSON.stringify(PROP);
      } else {
        MSG.value = PROP;
      }
      MSG_ARRAY.push(MSG);
    });
    return MSG_ARRAY.reverse();
  }
  
  onCloseMSGInfo() {
    this.appStore.dispatch(CleanSelectedMessage());
  }
  
  onSwitchView() {
    this.tabSettings$.pipe(take(1)).subscribe((settings: TabSettingsModel) => {
      this.appStore.dispatch(new StreamsTabsActions.SetTabSettings({
        tabSettings: {...settings, messageJSONType: !settings.messageJSONType},
      }));
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
