import { HttpErrorResponse }   from '@angular/common/http';
import { Component, Input }    from '@angular/core';
import { select, Store }       from '@ngrx/store';
import { take }                from 'rxjs/operators';
import { AppState }            from '../../core/store';
import { RemoveTab }           from '../../pages/streams/store/streams-tabs/streams-tabs.actions';
import { getActiveOrFirstTab } from '../../pages/streams/store/streams-tabs/streams-tabs.selectors';

@Component({
  selector: 'app-page-loading',
  templateUrl: './page-loading.component.html',
  styleUrls: ['./page-loading.component.scss'],
})
export class PageLoadingComponent {
  @Input() loaded: boolean;
  @Input() error: HttpErrorResponse;
  
  constructor(
    private appStore: Store<AppState>,
  ) {}
  
  closeTab() {
    this.appStore.pipe(select(getActiveOrFirstTab), take(1)).subscribe((tab) => this.appStore.dispatch(new RemoveTab({tab})));
  }
}
