import {Injectable} from '@angular/core';
import {StreamDetailsModel} from '../../pages/streams/models/stream.details.model';
import {SchemaTypeModel, SchemaTypesMap} from '../models/schema.type.model';

@Injectable({
  providedIn: 'root',
})
export class StreamModelsService {
  getStreamModels(data: StreamDetailsModel[], schema: SchemaTypeModel[]): StreamDetailsModel[] {
    const map = this.getSchemaMap(schema);
    return data.map((streamDetails) => new StreamDetailsModel(streamDetails, map));
  }

  getSchemaMap(schema: SchemaTypeModel[]): SchemaTypesMap {
    const map = new Map();
    schema.forEach((type) => {
      map.set(type.name.replace(/\./g, '-'), {
        fields: new Set<string>(type.fields.map((field) => field.name.replace(/\./g, '-'))),
        parent: type.parent?.replace(/\./g, '-'),
      });
    });
    return map;
  }

  // Add missed parents from all to types and sorts by tree
  getSchemaForColumns(types: SchemaTypeModel[], all: SchemaTypeModel[]): SchemaTypeModel[] {
    const typeByName = new Map<string, SchemaTypeModel>();
    const children = new Map<string, Set<string>>();
    const sortIndexes = new Map<string, number>();
    all
      .sort((t1, t2) => (t1.name > t2.name ? 1 : -1))
      .forEach((type) => {
        typeByName.set(type.name, type);
        if (!children.get(type.parent)) {
          children.set(type.parent, new Set<string>());
        }
        const childrenEntry = children.get(type.parent);
        childrenEntry.add(type.name);
      });
    let sortIndex = 0;
    const setIndexes = (parent: string) => {
      sortIndexes.set(parent, sortIndex);
      sortIndex++;
      children.get(parent)?.forEach((child) => setIndexes(child));
    };
    setIndexes(null);

    const typesSet = new Set(types.map((t) => t.name));
    const result = [...types];
    const addParentIfNotExists = (type: SchemaTypeModel) => {
      if (type.parent && !typesSet.has(type.parent)) {
        const parent = typeByName.get(type.parent);
        result.push(parent);
        typesSet.add(type.parent);
        addParentIfNotExists(parent);
      }
    };

    result.forEach((type) => addParentIfNotExists(type));
    return result.sort((t1, t2) => (sortIndexes.get(t1.name) > sortIndexes.get(t2.name) ? 1 : -1));
  }
}
