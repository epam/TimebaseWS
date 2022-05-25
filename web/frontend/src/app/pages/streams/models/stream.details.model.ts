import { SchemaTypesMap } from '../../../shared/models/schema.type.model';

export class StreamDetailsModel {
  public symbol: string;
  public timestamp: string;
  public type?: string;
  public $type: string;
  public original: Partial<StreamDetailsModel> = {};

  constructor(obj: {[index: string]: any}, schema: SchemaTypesMap = null) {
    let typeName;
    if (typeof obj?.$type === 'string') {
      typeName = obj.$type.replace(/\./g, '-');
    }

    if (typeName !== undefined) {
      this.setFields(obj, typeName, schema);
    }

    this.symbol = obj?.symbol;
    this.timestamp = obj?.timestamp;
    this.$type = obj?.$type;
    this.original.symbol = this.symbol;
    this.original.timestamp = this.timestamp;
    this.original.$type = this.$type;
  }

  private setFields(
    obj: {[index: string]: string},
    typeName: string,
    schema: SchemaTypesMap,
    parentLoop = false,
  ) {
    if (!schema) {
      this[typeName] = {...obj};
      this.original = {[typeName]: {...obj}};
      return;
    }

    const schemaItem = schema.get(typeName);

    this[typeName] = {};
    this.original[typeName] = {};

    Object.keys(obj).forEach((key) => {
      const fieldName = key.replace(/\./g, '-');
      if (schemaItem?.fields?.has(fieldName)) {
        this[typeName][fieldName] = obj[key];
      }

      if (!parentLoop) {
        this.original[typeName][fieldName] = obj[key];
      }
    });

    if (schemaItem?.parent) {
      this.setFields(obj, schemaItem?.parent, schema, true);
    }
  }
}
