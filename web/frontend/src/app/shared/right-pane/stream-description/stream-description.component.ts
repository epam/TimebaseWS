import { Component, OnInit, ViewChild }   from '@angular/core';
import { select, Store }                  from '@ngrx/store';
import { TranslateService }               from '@ngx-translate/core';
import { combineLatest, Observable, of } from 'rxjs';
import { delay, filter, map, switchMap } from 'rxjs/operators';
import { AppState }                      from '../../../core/store';
import { getActiveTab }                   from '../../../pages/streams/store/streams-tabs/streams-tabs.selectors';
import { StreamDescribeContentComponent } from '../../components/stream-describe-content/stream-describe-content.component';
import { MenuItem }                       from '../../models/menu-item';
import { ViewsService }                   from '../../services/views.service';
import * as NotificationsActions          from '../../../core/modules/notifications/store/notifications.actions';

@Component({
  selector: 'app-stream-description',
  templateUrl: './stream-description.component.html',
  styleUrls: ['./stream-description.component.scss'],
})
export class StreamDescriptionComponent implements OnInit {
  
  @ViewChild(StreamDescribeContentComponent) private streamDescribeContentComponent: StreamDescribeContentComponent;
  
  title$: Observable<string>;
  streamName$: Observable<string>;
  stream$: Observable<MenuItem>;
  view$: Observable<{ query: string }>;
  viewLoaded$: Observable<boolean>;
  
  constructor(
    private appStore: Store<AppState>,
    private viewsService: ViewsService,
    private translateService: TranslateService,
  ) { }
  
  ngOnInit(): void {
    const tab$ = this.appStore.pipe(select(getActiveTab), filter(t => !!t));
    this.title$ = tab$.pipe(map(tab => 'describeModal.title.' + (tab.isView ? 'view' : 'stream')));
    this.streamName$ = tab$.pipe(map(tab => tab.streamName));
    this.stream$ = tab$.pipe(map(tab => ({id: tab.stream, name: tab.streamName})));
    this.view$ = tab$.pipe(switchMap(tab => tab.isView ? this.viewsService.get(tab.streamName) : of(null)));
    this.viewLoaded$ = combineLatest([this.view$, tab$]).pipe(
      map(([view, tab]) => !tab.isView || !!view),
      delay(0),
    );
  }
  
  onCopy() {
    this.streamDescribeContentComponent.copy().pipe(
      switchMap(copyType => this.translateService.get(`streamDescriptionPane.copySuccess.${copyType}`)),
    ).subscribe(message => {
      this.appStore.dispatch(
        new NotificationsActions.AddNotification({
          message,
          dismissible: true,
          closeInterval: 1500,
          type: 'success',
        }),
      );
    });
  }
}
