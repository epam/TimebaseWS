import IEditorOptions = monaco.editor.IEditorOptions;

export interface MonacoEditorOptions extends IEditorOptions {
  theme: string;
  language: string;
}

export enum QqlSequenceAreaType {
  columns = 'columns',
  streams = 'streams',
}

export enum QqlSequenceKeyWord56 {
  record = 'RECORD',
  having = 'HAVING',
  resolve = 'RESOLVE',
  set = 'SET',
  add = 'ADD',
  rewrite = 'REWRITE',
  rename = 'RENAME',
};

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
  is = 'IS',
  not = 'NOT',
  null = 'NULL',
  nan = 'NAN',
  and = 'AND',
  or = 'OR',
  new = 'NEW',
  false = 'FALSE',
  true = 'TRUE',
  in = 'IN',
  group = 'GROUP',
  by = 'BY',
  between = 'BETWEEN',
  array = 'ARRAY',
  object = 'OBJECT',
  field = 'FIELD',
  create = 'CREATE',
  stream = 'STREAM',
  options = 'OPTIONS',
  transient = 'TRANSIENT',
  durable = 'DURABLE',
  class = 'CLASS',
  guid = 'GUID',
  auxillary = 'AUXILIARY',
  instantiable = 'INSTANTIABLE',
  relative = 'RELATIVE',
  to = 'TO',
  comment = 'COMMENT',
  enum = 'ENUM',
  flags = 'FLAGS',
  under = 'UNDER',
  static = 'STATIC',
  drop = 'DROP',
  alter = 'ALTER',
  modify = 'MODIFY',
  default = 'DEFAULT',
  confirm = 'CONFIRM',
  like = 'LIKE',
  tags = 'TAGS',
  join = 'JOIN',
  left = 'LEFT',
  type = 'TYPE',
  if = 'IF',
  else = 'ELSE',
  case = 'CASE',
  when = 'WHEN',
  then = 'THEN',
  end = 'END'
};

export enum QqlToken {
  keyword = 'keyword',
  keyword56 = 'keyword56',
  asterisk = 'asterisk',
  integer = 'integer',
  string = 'string',
  text = 'text',
  stream = 'stream',
  field = 'field',
  functions = 'functions',
  dateLiteral = 'dateLiteral',
  dataType = 'dataType',
  comment = 'comment',
  multilineComment = 'multilineComment',
  timeField = 'timeField'
}
export interface QQLSyntaxGroup {
  startWith: QqlSequenceKeyWord | QqlSequenceKeyWord56;
  optionalPrepend?: string[][];
  required?: boolean;
  patterns: string[];
}
