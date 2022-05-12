import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StreamRenameService {
  private spaceRenamed$ = new Subject<{streamId: string; oldName: string; newName: string}>();
  private symbolRenamed$ = new Subject<{streamId: string; oldName: string; newName: string}>();

  spaceRenamed(streamId: string, oldName: string, newName: string) {
    this.spaceRenamed$.next({streamId, oldName, newName});
  }

  onSpaceRenamed(): Observable<{streamId: string; oldName: string; newName: string}> {
    return this.spaceRenamed$.asObservable();
  }

  symbolRenamed(streamId: string, oldName: string, newName: string) {
    this.symbolRenamed$.next({streamId, oldName, newName});
  }

  onSymbolRenamed(): Observable<{streamId: string; oldName: string; newName: string}> {
    return this.symbolRenamed$.asObservable();
  }
}
