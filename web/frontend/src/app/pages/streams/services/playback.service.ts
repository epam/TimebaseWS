import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { WSService } from 'src/app/core/services/ws.service';
import { map, tap, takeUntil, filter, first, switchMap } from 'rxjs/operators';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { PermissionsService } from 'src/app/shared/services/permissions.service';

interface playbackSettings {
  sourceStreams: string[],
  targetStream: string,
  speed: number;
  cyclic: boolean;
  permanent: boolean;
  from?: string,
  to?: string,
  targetTopic?: boolean,
  sourceTb?: string,
  targetTb?: string,
}

interface playBackInfo {
  id: number;
  sourceStreams: string[];
  targetStream: string;
  speed: number | string;
  state: string;
  progress: number;
  permanent: boolean;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PlaybackService {
  activeSessions = new Set<number>();
  activeSessionsSubject = new Subject<number[]>();
  playbackControlActivated = new Subject<number | null>();
  lastActivatedPlaybackId: number | null;
  targetStreams: { [ playbackId: string ]: string } = {};
  sourceStreams: { [ playbackId: string ]: string[] } = {};
  playingPlaybacks = new Set<number>();
  speedValues: { [ playbackId: string ]: string } = {};
  permanenceValues: { [ playbackId: string ]: boolean } = {};
  playbackProgress$ = new Subject<{ [ playbackId: string ]: string }>();
  playbackSpeed$ = new Subject<{ [ playbackId: string ]: string }>();
  playbackPermanence$ = new Subject<{ [ playbackId: string ]: boolean }>();
  playbackState$ = new Subject<{ [ playbackId: string ]: string }>();
  endSession$ = new Subject<number>();
  playbackLastState: {
    [playbackId: string]: {
      stopped: boolean,
      paused: boolean,
      progress: number
    }
  } = {};
  playBackSubscriptions = new Map<number, Subscription>();

  constructor(private http: HttpClient, private wsService: WSService, private permissionsService: PermissionsService) {
    const savedPlaybackState = JSON.parse(sessionStorage.getItem('playbackState'));


    if (savedPlaybackState) {
      this.activeSessions = new Set(savedPlaybackState.activePlaybackSessions);
      this.activeSessionsSubject.next(savedPlaybackState.activePlaybackSessions);
      this.getPlaybackData(savedPlaybackState);
    }

    fromEvent(window, "beforeunload")
      .pipe(first())
      .subscribe(() => this.savePlaybackState());
}

  createPlayback(params: playbackSettings) {
    return this.http.post('playback', params).pipe(tap((id: number) => {
      this.activeSessions.add(id);
      this.activeSessionsSubject.next(Array.from(this.activeSessions));
      this.targetStreams = { ...this.targetStreams, [id]: params.targetStream };
      this.sourceStreams = { ...this.sourceStreams, [id]: params.sourceStreams };
      this.lastActivatedPlaybackId = id;
      this.playbackControlActivated.next(id);
    }));
  }

  getAllPlaybacks() {
    return this.http.get('playback');
  }

  playbackProgress(id: number) {
    if (!this.playBackSubscriptions.get(id)) {
      const stateSubscription = this.wsService.watch(`/user/topic/playback/${id}`)
        .pipe(map(({body}) => JSON.parse(body)), takeUntil(this.endSession$.pipe(filter(playbackId => playbackId === id))))
        .subscribe(message => {
          this.playbackSpeed$.next({ [id]: message.speed });
          this.playbackPermanence$.next({ [id]: message.permanent });
          this.playbackState$.next({ [id]: message.mod });
          this.playbackProgress$.next({ [id]: '' + Math.round(message.progress * 100) });
        });
      this.playBackSubscriptions.set(id, stateSubscription);
      return stateSubscription;
    }
  }

  setPlaybackState(action: string, id: number) {
    return this.http.post(`playback/${action}`, {}, { params: { id } });
  }

  changeSpeed(speed: number, id: number) {
    const params = {
      id,
      speed
    }
    return this.http.post('playback/speed', {}, { params });
  }

  playBackIsPlaying(id: number) {
    return this.playingPlaybacks.has(id);
  }

  endSession(id: number) {
    this.activeSessions.delete(id);
    this.activeSessionsSubject.next(Array.from(this.activeSessions));
    this.lastActivatedPlaybackId = null;
    this.playbackControlActivated.next(null);
    delete this.targetStreams[id];
    delete this.sourceStreams[id];
    this.playingPlaybacks.delete(id);
    this.playbackProgress$.next({ [id]: '0' });
    this.endSession$.next(id);
    this.playBackSubscriptions.get(id)?.unsubscribe();
    this.playBackSubscriptions.delete(id);
  }

  savePlaybackState() {
    const playbackState = {
      activePlaybackSessions: Array.from(this.activeSessions),
      lastActivatedPlaybackId: this.lastActivatedPlaybackId,
      targetStreams: this.targetStreams,
      sourceStreams: this.sourceStreams,
      playingPlaybacks: Array.from(this.playingPlaybacks),
      speedValues: this.speedValues,
      playbackLastState: this.playbackLastState,
      permanenceValues: this.permanenceValues
    }
    sessionStorage.setItem('playbackState', JSON.stringify(playbackState));
  }

  unsubscribeFromAllPlaybacks(): void {
    sessionStorage.setItem('playbackState', null);
    Array.from(this.activeSessions).forEach(sessionId => this.endSession(sessionId));
  }

  togglePlaybackPermanence(playbackId: number, isPermanent: boolean) {
    const params = {
      id: playbackId,
      permanent: isPermanent
    }
    return this.http.post('playback/permanent', null, { params });
  }

  private getPlaybackData({
    lastActivatedPlaybackId, targetStreams, sourceStreams, 
    playingPlaybacks, speedValues, playbackLastState, permanence
  }) {
    if (lastActivatedPlaybackId) {
      this.playbackControlActivated.next(lastActivatedPlaybackId);
      this.lastActivatedPlaybackId = lastActivatedPlaybackId;
    }
    if (playingPlaybacks) {
      this.playingPlaybacks = new Set([...Array.from(this.playingPlaybacks), ...playingPlaybacks]);
    }
    this.targetStreams = {
      ...this.targetStreams, ...targetStreams
    };
    this.sourceStreams = {
      ...this.sourceStreams, ...sourceStreams
    };
    this.speedValues = {
      ...this.speedValues, ...speedValues
    };
    this.permanenceValues = {
      ...this.permanenceValues, ...permanence
    };
    this.playbackLastState = {
      ...this.playbackLastState, ...playbackLastState
    };
  }

  getPlaybackList() {
    this.permissionsService.isWriter()
      .pipe(
        filter(Boolean),
        switchMap(() => this.getAllPlaybacks()),
        first()
      )
      .subscribe((playbackList: playBackInfo[]) => this.updatePlaybackList(playbackList));
  };

  private updatePlaybackList(playbacks: playBackInfo[]) {
    for (let playback of playbacks) {
      this.activeSessions.add(playback.id);
      this.activeSessionsSubject.next(Array.from(this.activeSessions));
      this.getPlaybackData({ targetStreams: { [playback.id]: playback.targetStream }, 
        sourceStreams: { [playback.id]: playback.sourceStreams }, 
        speedValues: { [playback.id]: (playback.speed === 'MAX' || +playback.speed > 10) ? 'MAX' : `${playback.speed}x` },
        permanence: { [playback.id]: playback.permanent },
        playbackLastState: { [playback.id]: {
          stopped: playback.state === 'STOP',
          paused: playback.state === 'PAUSED',
          progress: playback.progress 
        }},
        playingPlaybacks: [playback.id], lastActivatedPlaybackId: null });
    }
  };
}
