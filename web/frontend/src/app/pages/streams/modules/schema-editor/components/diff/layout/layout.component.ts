import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable, Subject} from 'rxjs';
import {filter, take, takeUntil} from 'rxjs/operators';
import {AppState} from '../../../../../../../core/store';
import {StreamMetaDataChangeModel} from '../../../models/stream.meta.data.change.model';
import {getSchemaDiff} from '../../../store/schema-editor.selectors';

@Component({
  selector: 'app-diff-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit, OnDestroy {
  public getSchemaDiff$: Observable<StreamMetaDataChangeModel>;
  public editorOptions = {
    theme: 'vs-dark',
    language: 'json',
    automaticLayout: true,
  };
  public editor;
  public editorData = {
    editorOptions: {
      theme: 'vs-dark',
      language: 'json',
      automaticLayout: true,
      codeLens: false,
      folding: true,
      // foldingStrategy: 'indentation',
      minimap: {enabled: false},
    },
    text: '',
  };
  private destroy$ = new Subject();

  constructor(private appStore: Store<AppState>) {}

  ngOnInit() {
    this.getSchemaDiff$ = this.appStore.pipe(select(getSchemaDiff));

    this.getSchemaDiff$
      .pipe(
        filter((diff) => !!diff),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe((diff) => {
        this.editorData = {
          ...this.editorData,
          text: JSON.stringify(diff),
        };
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
