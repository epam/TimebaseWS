export enum ExportTo {
  oneFile = 'SINGLE_FILE',
  filesBySymbol = 'FILE_PER_SYMBOL',
  filePerSpace = 'FILE_PER_SPACE',
}

export enum ExportFilterFormat {
  CSV = 'CSV',
  QSMSG = 'QSMSG',
}

export interface ExportFilterType {
  name: string;
  fields: string[];
}

export interface ExportFilter {
  from: string;
  to: string;
  types: ExportFilterType[];
  format: ExportFilterFormat;
  valueSeparator: string;
  mode: ExportTo;
  symbols?: string[];
}
