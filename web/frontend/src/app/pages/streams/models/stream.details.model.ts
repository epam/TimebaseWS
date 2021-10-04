export const DEFAULT_$TYPE_NAME = 'DEFAULT_$TYPE_NAME';

export class StreamDetailsModel {
  public symbol: string;
  public timestamp: string;
  public type?: string;
  public $type: string;

  constructor(obj) {
    let typeName;
    if (obj && obj.$type) {
      typeName = obj.$type.replace(/\./g, '-');
    } else if (typeof obj.$type === 'string' && obj.$type.length === 0) {
      typeName = DEFAULT_$TYPE_NAME;
    }

    if (typeName) {
      this[typeName] = { ...obj };
    }

    if (typeName === DEFAULT_$TYPE_NAME) {
      Object.keys(this[typeName]).forEach(key => {
        if (key.match(/\./)) {
          this[typeName][key.replace(/\./g, '-')] = this[typeName][key];
          delete this[typeName][key];
        }
      });
    }

    this.symbol = obj.symbol;
    this.timestamp = obj.timestamp;
    this.$type = obj.$type;
  }
}
