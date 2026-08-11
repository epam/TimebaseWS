import {Injectable}        from '@angular/core';
import { Observable }      from 'rxjs';
import {WSService}         from '../../../core/services/ws.service';
import { StructureUpdate } from '../models/structure-update';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class StructureUpdatesService {
  constructor(private wsService: WSService, private httpClient: HttpClient) {
  }

  onUpdates(): Observable<StructureUpdate[]> {
    return this.wsService.watchObject(`/topic/structure-events`);
  }

  onStreamUpdates(): Observable<any> {
    return this.wsService.watchObject(`/topic/streams`);
  }

  getBackgroundTask(streamId: string, tbId: string = null): Observable<any> {
    return this.httpClient.get(`/${encodeURIComponent(streamId)}/options/backgroundTask`, {
      headers: { customError: 'true' },
      params: tbId ? {tb: tbId} : {},
    });
  }

  abortBackgroundTask(streamId: string, tbId: string = null): Observable<any> {
    return this.httpClient.get(`/${encodeURIComponent(streamId)}/abortBackgroundTask`, {
      params: tbId ? {tb: tbId} : {},
    });
  }

  saveTabSynchronizationState(enabled: boolean) {
    sessionStorage.setItem('tab-synchronization', '' + enabled);
  }

  getTabSynchronizationState() {
    return sessionStorage.getItem('tab-synchronization');
  }
}
