export class StreamQueryModel {
  rows: number;
  query: string;
  from?: string;
  to?: string;
  offset: number;
  reverse?: boolean;
  types?: string[];
  symbols?: string[];

  constructor(obj: StreamQueryModel | {}) {
    Object.assign(this, obj);
  }
  
}
