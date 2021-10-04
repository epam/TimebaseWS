import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SendMessagePopupService {

  public showEditor$ = new Subject();
  public closeEditor$ = new Subject();
  constructor() { }

  public onShowEditor(data: any) {
    this.showEditor$.next(data);
    return this.closeEditor$;
  }

  public onEditorIsClosed(data: any) {
    this.closeEditor$.next(data);
  }
}
