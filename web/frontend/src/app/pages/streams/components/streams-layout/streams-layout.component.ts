import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
}                              from '@angular/core';
import { Store }               from '@ngrx/store';
import { Observable }          from 'rxjs';
import { AppState }            from '../../../../core/store';
import { GlobalResizeService } from '../../../../shared/services/global-resize.service';
import * as StreamsTabsActions
                               from '../../store/streams-tabs/streams-tabs.actions';

@Component({
  selector: 'app-streams-layout',
  templateUrl: './streams-layout.component.html',
  styleUrls: ['./streams-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamsLayoutComponent implements OnInit, OnDestroy {
  
  @ViewChild('container', {read: ElementRef}) private container: ElementRef<HTMLElement>;
  
  sizes$: Observable<number[]>;
  contentSize$: Observable<number>;
  resizerDisable$: Observable<boolean>;
  minSize: number;
  
  constructor(
    private appStore: Store<AppState>,
    private globalResizeService: GlobalResizeService,
  ) { }
  
  ngOnInit() {
    this.appStore.dispatch(new StreamsTabsActions.LoadTabsFromLS());
    this.resizerDisable$ = this.globalResizeService.onCollapse();
  }
  
  ngOnDestroy(): void {
    this.appStore.dispatch(new StreamsTabsActions.StopTabsSync());
  }
  
  onDragProgress() {
    this.globalResizeService.progress();
  }
}
