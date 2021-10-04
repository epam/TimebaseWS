import { HttpClient }           from '@angular/common/http';
import { Injectable }           from '@angular/core';
import { Observable, Subject }  from 'rxjs';
import { map, takeUntil }                              from 'rxjs/operators';
import { SchemaClassFieldModel, SchemaClassTypeModel } from '../../../shared/models/schema.class.type.model';

export interface SimpleColumnModel {
  field: string;
  headerName: string;
  headerTooltip: string;
  children?: SimpleColumnModel[];
  required?: boolean;
  dataType?: string;
  controlType?: string;
  controlCollection?: {
    key: string,
    title: string,
  }[];
  changeEvent?: (any) => void;
  rendered?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SchemaDataService {

  private $destroy = new Subject();

  constructor(
    private httpClient: HttpClient,
  ) { }

  public getSchema(streamId: string): Observable<[SchemaClassTypeModel[], SimpleColumnModel[]]> {
    return this.httpClient
      .get<{
        types: SchemaClassTypeModel[];
        all: SchemaClassTypeModel[];
      }>(`/${encodeURIComponent(streamId)}/schema`)
      .pipe(
        takeUntil(this.$destroy),
        map((resp) => {
          let schemaTypes: SchemaClassTypeModel[] = [];
          let schemaAll: SchemaClassTypeModel[] = [];

          if (resp) {
            if (resp['types']) {
              schemaTypes = resp['types'];
            }
            if (resp['all']) {
              schemaAll = resp['all'];
            }
          }
          return [schemaAll, this.getGridConfig(schemaTypes)];
        }),
      );
  }

  public getGridConfig(schema: SchemaClassTypeModel[]) {
    return this.generateConfig(schema, '');
  }

  // public getSimplifiedConfig(gridConfig: []): SimpleColumnModel[] {
  //   return gridConfig.map(columnConfig => {
  //     const SIMPLE_COLUMN: SimpleColumnModel = {
  //       field: columnConfig['field'],
  //       headerName: columnConfig['headerName'],
  //       headerTooltip: columnConfig['headerTooltip'],
  //     };
  //     if (columnConfig['children']) {
  //       SIMPLE_COLUMN['children'] = this.getSimplifiedConfig(columnConfig['children']);
  //     }
  //     return SIMPLE_COLUMN;
  //   });
  // }

  public generateConfig(rawData: (SchemaClassTypeModel | SchemaClassFieldModel)[], parentKey = ''): SimpleColumnModel[] {
    if (!rawData) {
      return [];
    }
    return rawData.map(SchemaTypeModel => {
      const column: SimpleColumnModel = {
        headerName: SchemaTypeModel.title || SchemaTypeModel.name,
        field: /*parentKey + */SchemaTypeModel.name.replace(/\./g, '-'),
        headerTooltip: SchemaTypeModel.title || SchemaTypeModel.name,
      };
      if ((SchemaTypeModel as SchemaClassTypeModel).fields) {
        column['children'] = this.generateConfig((SchemaTypeModel as SchemaClassTypeModel).fields, column.field + '.');
      } else {
        const TYPE = (SchemaTypeModel as SchemaClassFieldModel).type;
        column.required = typeof TYPE.nullable === 'boolean' ? !TYPE.nullable : false;
        column.dataType = TYPE.name;
        switch (column.dataType) {
          case 'BOOLEAN':
            column.controlType = 'checkbox';
            break;
          case 'TIMESTAMP':
            column.controlType = 'dateTime';
            break;
          default:
            break;
        }
      }
      return column;
    });
  }

  public getSymbols(streamKey) {
    return this.httpClient
      .get<string[]>(`/${encodeURIComponent(streamKey)}/symbols`);
  }

  public destroy() {
    this.$destroy.next(true);
    this.$destroy.complete();
    this.$destroy = new Subject();
  }

}
