import { SchemaTypeModel } from './schema.type.model';
import { StreamDetailsModel } from '../../pages/streams/models/stream.details.model';

export interface GridDataStoreModel {
  data: [SchemaTypeModel[], StreamDetailsModel[]];
  error: string | null;
  hideColumnsByDefault?: boolean;
  editorSize: number;
}
