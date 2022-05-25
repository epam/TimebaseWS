import { StreamDetailsModel } from '../../pages/streams/models/stream.details.model';
import { HasRightPanel }      from '../right-pane/has-right-panel';
import { SchemaTypeModel }    from './schema.type.model';

export enum GridTypes {
  monitor = 'monitor',
  view = 'view',
  live = 'live',
}

export enum ExportTypes {
  qsmsg = 'QSMSG',
  csv = 'CSV',
}

export interface GridDataStoreModel extends HasRightPanel {
  data: [
    SchemaTypeModel[],
    StreamDetailsModel[],
    {types: SchemaTypeModel[]; all: SchemaTypeModel[]},
  ];
  error: string | null;
  hideColumnsByDefault?: boolean;
  editorSize: number;
  gridType: GridTypes;
  exportType: ExportTypes;
  query: string;
}
