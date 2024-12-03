import {Injectable} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {combineLatest, Observable} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {AppState} from '../../../../../core/store';
import {getDefaultsTypes, getSchemaDiff} from '../store/schema-editor.selectors';
import { ActivatedRoute } from '@angular/router';

@Injectable()
export class SeDataService {
  
  constructor(private appStore: Store<AppState>, private route: ActivatedRoute) {}

  showClassListGrid(): Observable<boolean> {
    if (this.route.snapshot.data.streamCreate || this.route.snapshot.data.topicCreate) {
      return combineLatest([
        this.appStore.pipe(select(getSchemaDiff)),
        this.appStore.pipe(select(getDefaultsTypes)),
      ]).pipe(
        map(([schemaDiff, defaultDataTypes]) => !schemaDiff && !!defaultDataTypes?.length),
        distinctUntilChanged()
      )
    } else {
      return this.appStore.pipe(select(getDefaultsTypes)).pipe(
        map((defaultDataTypes) => !!defaultDataTypes?.length),
        distinctUntilChanged(),
      );
    }
  }
}
