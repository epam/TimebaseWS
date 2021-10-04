import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { getDefaultsTypes, getSchemaDiff } from '../store/schema-editor.selectors';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { AppState } from '../../../../../core/store';
import { combineLatest, Observable } from 'rxjs';

@Injectable()
export class SeDataService {

  constructor(private appStore: Store<AppState>) {
  }

  showClassListGrid(): Observable<boolean> {
    return combineLatest([
      this.appStore.pipe(select(getSchemaDiff)),
      this.appStore.pipe(select(getDefaultsTypes)),
    ]).pipe(
      map(([schemaDiff, defaultDataTypes]) => !schemaDiff && !!defaultDataTypes?.length),
      distinctUntilChanged(),
    );
  }
}
