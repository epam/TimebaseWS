import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SchemaAllTypeModel, SchemaTypeModel } from '../models/schema.type.model';

@Injectable({
  providedIn: 'root',
})
export class SchemaService {
  constructor(private httpClient: HttpClient) {
  }

  getSchema(stream: string, spaceId: string = null) {
    return this.httpClient
      .get<{types: SchemaTypeModel[], all: SchemaAllTypeModel[]}>(`/${encodeURIComponent(stream)}/schema`, {
        params: {
          ...(typeof spaceId === 'string' ? {
            space: encodeURIComponent(spaceId),
          } : {}),
        },
      });
  }
}
