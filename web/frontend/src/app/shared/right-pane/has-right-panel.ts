import { Column }             from 'ag-grid-community';
import { StreamDetailsModel } from '../../pages/streams/models/stream.details.model';

export interface HasRightPanel {
  selectedMessage: StreamDetailsModel;
  showProps: boolean;
  showMessageInfo: boolean;
  showViewInfo: boolean;
  showDescription: boolean;
  from: string;
  messageView: string;
  rowIndex: number;
  columns: Column[];
}
