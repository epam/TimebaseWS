import IEditorOptions = monaco.editor.IEditorOptions;

export interface MonacoEditorOptions extends IEditorOptions {
  theme: string;
  language: string;
}

export enum QqlSequenceAreaType {
  columns = 'columns',
  streams = 'streams',
}

export enum QqlSequenceKeyWord {
  select = 'SELECT',
  from = 'FROM',
  where = 'WHERE',
  groupBy = 'GROUP BY',
  union = 'UNION',
  with = 'WITH',
  distinct = 'DISTINCT',
  running = 'RUNNING',
  over = 'OVER',
  arrayJoin = 'ARRAY JOIN',
  trigger = 'TRIGGER',
  reset = 'RESET',
  every = 'EVERY',
  limit = 'LIMIT',
  offset = 'OFFSET',
  time = 'TIME',
  count = 'COUNT',
  as = 'AS',
}

export enum QqlToken {
  keyword = 'keyword',
  asterisk = 'asterisk',
  integer = 'integer',
  string = 'string',
  text = 'text',
  stream = 'stream',
  field = 'field',
  dateLiteral = 'dateLiteral',
  dataType = 'dataType',
}

export interface QQLSyntaxGroup {
  startWith: QqlSequenceKeyWord;
  optionalPrepend?: string[][];
  required?: boolean;
  patterns: string[];
}
