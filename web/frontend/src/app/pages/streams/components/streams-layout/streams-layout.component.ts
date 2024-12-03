import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable, Subject} from 'rxjs';
import { takeUntil, first } from 'rxjs/operators';
import {AppState} from '../../../../core/store';
import {GlobalResizeService} from '../../../../shared/services/global-resize.service';
import * as StreamsTabsActions from '../../store/streams-tabs/streams-tabs.actions';
import { PlaybackService } from '../../services/playback.service';

@Component({
  selector: 'app-streams-layout',
  templateUrl: './streams-layout.component.html',
  styleUrls: ['./streams-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamsLayoutComponent implements OnInit, OnDestroy {
  activePlayBackId: number;
  resizerDisable$: Observable<boolean>;
  minSize: number;
  @ViewChild('container', {read: ElementRef}) private container: ElementRef<HTMLElement>;

  private destroy$ = new Subject();

  constructor(
    private appStore: Store<AppState>,
    private globalResizeService: GlobalResizeService,
    public playbackService: PlaybackService
  ) {}

  ngOnInit() {
    this.appStore.dispatch(new StreamsTabsActions.LoadTabsFromLS());
    this.resizerDisable$ = this.globalResizeService.onCollapse();

    this.playbackService.getPlaybackList();

    this.activePlayBackId = this.playbackService.lastActivatedPlaybackId;
    this.playbackService.playbackControlActivated
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => this.activePlayBackId = id);
  }

  ngOnDestroy(): void {
    this.appStore.dispatch(new StreamsTabsActions.StopTabsSync());
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
