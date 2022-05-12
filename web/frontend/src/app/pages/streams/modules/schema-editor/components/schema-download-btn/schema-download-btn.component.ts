import {Component, OnInit} from '@angular/core';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {select, Store} from '@ngrx/store';
import {combineLatest, Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {AppState} from '../../../../../../core/store';
import {
  SchemaClassFieldPropsModel,
  SchemaClassTypeModel,
} from '../../../../../../shared/models/schema.class.type.model';
import {TabModel} from '../../../../models/tab.model';
import {getActiveOrFirstTab} from '../../../../store/streams-tabs/streams-tabs.selectors';
import {SeFieldFormsService} from '../../services/se-field-forms.service';
import {getEditSchemaState} from '../../store/schema-editor.selectors';

@Component({
  selector: 'app-schema-download-btn',
  templateUrl: './schema-download-btn.component.html',
  styleUrls: ['./schema-download-btn.component.scss'],
})
export class SchemaDownloadBtnComponent implements OnInit {
  href$: Observable<SafeUrl>;
  title$: Observable<string>;

  constructor(
    private appStore: Store<AppState>,
    private sanitizer: DomSanitizer,
    private seFieldFormsService: SeFieldFormsService,
  ) {}

  ngOnInit(): void {
    this.href$ = combineLatest([
      this.appStore.pipe(select(getEditSchemaState)),
      this.seFieldFormsService.dumpState(),
    ]).pipe(
      map(([data, formState]) => {
        const state = {
          classes: this.clearProps(data.classes),
          enums: this.clearProps(data.enums),
        };
        return this.sanitizer.bypassSecurityTrustUrl(
          `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify({state, formState}, null, '\t'),
          )}`,
        );
      }),
    );

    this.title$ = this.appStore
      .pipe(select(getActiveOrFirstTab), filter(Boolean))
      .pipe(map((tab: TabModel) => `${tab.stream}.schema.json`));
  }

  private clearProps(types: SchemaClassTypeModel[]): SchemaClassTypeModel[] {
    return types.map((type) => ({
      ...type,
      fields: type.fields.map((field) => ({
        ...field,
        _props: this.clearFieldProps(field._props),
      })),
    }));
  }

  private clearFieldProps(props: SchemaClassFieldPropsModel): SchemaClassFieldPropsModel {
    const result = {...props};
    delete result._isCurrentEdited;
    return result;
  }
}
