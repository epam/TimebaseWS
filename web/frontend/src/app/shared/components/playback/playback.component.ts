import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { PlaybackService } from 'src/app/pages/streams/services/playback.service';
import { Subject, BehaviorSubject } from 'rxjs';
import { first, takeUntil, filter, pluck, map, switchMap } from 'rxjs/operators';
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';

const defaultSpeedOptions = ['1x', '2x', '5x', '10x', 'MAX'];

@Component({
  selector: 'app-playback',
  templateUrl: './playback.component.html',
  styleUrls: ['./playback.component.scss']
})
export class PlaybackComponent implements OnInit, OnChanges {
  @Input() playbackId: number;
  @Input() pinned: boolean = false;

  targetStream: string;
  sourceStreams: string[];
  playbackStopped: boolean = false;
  playbackProgress: number = 0;
  showPlayButton$ = new BehaviorSubject(false);
  form: FormGroup;
  playbackSpeedOptions: { id: string, name: string }[];
  isActivePlayback = new BehaviorSubject<boolean>(true);
  permanenceControl: AbstractControl;

  private playbackPaused: boolean = false;
  private settingsSet = false;
  private destroy$ = new Subject();
  private playbackChanged$ = new Subject();

  constructor(public playbackService: PlaybackService, private fb: FormBuilder) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.playbackId.currentValue) {
      if (!this.form) {
        this.form = this.fb.group({
          speed: null,
          permanent: null
        });

        this.permanenceControl = this.form.get('permanent');
      }

      if (this.settingsSet) {
        this.playbackChanged$.next();
        this.playbackChanged$.complete();
      }

      const playbackLastState = this.playbackService.playbackLastState[changes.playbackId.currentValue];
      if (playbackLastState) {
        this.playbackStopped = playbackLastState.stopped;
        this.playbackPaused = playbackLastState.paused;
        this.playbackProgress = playbackLastState.progress;
        this.showPlayButton$.next(this.playbackStopped || this.playbackPaused);
      }

      this.setControlSettings(changes.playbackId.currentValue);
    }
  }

  ngOnInit(): void {
    if (!this.form) {
      this.form = this.fb.group({
        speed: null,
        permanent: null
      });
    }

    this.form.get('speed').valueChanges
      .pipe(
        switchMap(speed => {
          this.playbackService.speedValues[this.playbackId] = speed;
          return this.onSpeedChanged(speed === 'MAX' ? Number.MAX_SAFE_INTEGER : parseFloat(speed))
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.form.get('permanent').valueChanges
      .pipe(
        switchMap(isPermanent => {
          this.playbackService.permanenceValues[this.playbackId] = isPermanent;
          return this.onPermanenceChanged(isPermanent);
        }),
        takeUntil(this.destroy$))
      .subscribe();

    if (this.pinned) {
      this.isActivePlayback.next(this.playbackId === this.playbackService.lastActivatedPlaybackId);
      this.playbackService.playbackControlActivated
        .pipe(takeUntil(this.destroy$))
        .subscribe(id => this.isActivePlayback.next(id === this.playbackId));
    }
  }

  private setControlSettings(id: number) {
    if (this.settingsSet) {
      this.playbackChanged$ = new Subject();
    }
    this.targetStream = this.playbackService.targetStreams[id];
    this.sourceStreams = this.playbackService.sourceStreams[id];

    if (!this.playbackService.playBackIsPlaying(id) && !this.pinned) {
      this.playbackService.setPlaybackState('play', id)
        .pipe(first(), takeUntil(this.playbackService.endSession$))
        .subscribe(() => this.playbackService.playingPlaybacks.add(id));
    }

    this.playbackService.playbackState$
      .pipe(
        filter(value => !!value[id]), 
        pluck(id),
        takeUntil(this.playbackChanged$)
      )
      .subscribe(state => {
        this.playbackStopped = state === 'STOP';
        this.playbackPaused = state === 'PAUSED';
        this.showPlayButton$.next(this.playbackStopped || this.playbackPaused);
        this.saveLastState(id);
      });

    this.playbackService.playbackProgress$
      .pipe(
        filter(value => !!value[id]), 
        pluck(id), 
        map(progress => +progress),
        takeUntil(this.playbackChanged$)
      )
      .subscribe(progress => {
        this.playbackProgress = progress;
        this.saveLastState(id);
      });

    this.playbackService.playbackSpeed$
      .pipe(
        filter(value => !!value[id]), 
        pluck(id),
        map(speed => +speed > 10 ? 'MAX' : `${speed}x`),
        takeUntil(this.playbackChanged$)
      )
      .subscribe(speed => {
        this.form.get('speed').patchValue(speed, { emitEvent: false } );
        this.saveLastState(id);
      });

    this.playbackService.playbackPermanence$
      .pipe(
        filter(value => !!value[id]), 
        pluck(id),
        takeUntil(this.playbackChanged$)
      )
      .subscribe(permanent => {
        this.form.get('permanent').patchValue(permanent, { emitEvent: false } );
        this.saveLastState(id);
      });

    const currentSpeed = this.playbackService.speedValues[id];
    this.playbackSpeedOptions = (defaultSpeedOptions.includes(currentSpeed) ? defaultSpeedOptions : [currentSpeed, ...defaultSpeedOptions])
      .map(option => ({ id: option, name: option }));
    this.form.patchValue({ speed: currentSpeed });
    this.form.patchValue({ permanent: this.playbackService.permanenceValues[id] });

    this.settingsSet = true;
  }

  onSpeedChanged(speed: number) {
    return this.playbackService.changeSpeed(speed, this.playbackId);
  }

  onPermanenceChanged(permanent: boolean) {
    return this.playbackService.togglePlaybackPermanence(this.playbackId, permanent);
  }

  toggleControl() {
    this.playbackService.lastActivatedPlaybackId = this.pinned ? this.playbackId : null;
    this.playbackService.playbackControlActivated.next(this.playbackService.lastActivatedPlaybackId);
  }

  setPlaybackState(state: string) {
    const playbackState = (state === 'resume' && this.playbackStopped) ? 'play' : state;
    this.playbackService.setPlaybackState(playbackState, this.playbackId)
      .pipe(first(), takeUntil(this.playbackService.endSession$.pipe(filter(value => value === this.playbackId))))
      .subscribe(() => {
        if (playbackState === 'close') {
          this.playbackService.endSession(this.playbackId);
        }
      });
  }

  private saveLastState(id: number) {
    this.playbackService.playbackLastState[id] = {
      stopped: this.playbackStopped,
      paused: this.playbackPaused,
      progress: this.playbackProgress
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.playbackChanged$.next();
    this.playbackChanged$.complete();
  }
}