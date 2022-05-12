import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {BsModalService} from 'ngx-bootstrap/modal';
import {Observable} from 'rxjs';
import {switchMap, take} from 'rxjs/operators';
import {ConfirmModalComponent} from './confirm-modal.component';

@Injectable({
  providedIn: 'root',
})
export class ConfirmModalService {
  constructor(private translateService: TranslateService, private bsModalService: BsModalService) {}

  confirm(translation: string): Observable<boolean> {
    return this.translateService.get(translation).pipe(
      take(1),
      switchMap((message) => {
        const modal: ConfirmModalComponent = this.bsModalService.show(ConfirmModalComponent, {
          initialState: {message},
        }).content;

        return modal.resolve;
      }),
    );
  }
}
