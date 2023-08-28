import {Injectable}        from '@angular/core';
import { Observable }      from 'rxjs';
import {WSService}         from '../../../core/services/ws.service';
import { StructureUpdate } from '../models/structure-update';

@Injectable({
  providedIn: 'root',
})
export class StructureUpdatesService {
  constructor(private wsService: WSService) {
  }

  onUpdates(): Observable<StructureUpdate[]> {
    return this.wsService.watchObject(`/topic/structure-events`);
  }
}
