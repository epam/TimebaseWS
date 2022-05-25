import { HttpClient }                          from '@angular/common/http';
import { Injectable }                          from '@angular/core';
import { SchemaAllTypeModel, SchemaTypeModel } from '../models/schema.type.model';
import { CacheRequestService }                 from './cache-request.service';

@Injectable({
  providedIn: 'root',
})
export class SchemaService {
  constructor(private httpClient: HttpClient, private cacheRequestService: CacheRequestService) {}

  getSchema(stream: string, spaceId: string = null, tree = false) {
    const params = {
      ...(typeof spaceId === 'string'
        ? {
            space: encodeURIComponent(spaceId),
          }
        : {}),
    };

    if (tree) {
      params['tree'] = 'true';
    }
    return this.cacheRequestService.cache(
      {action: 'getSchema', stream, spaceId, tree},
      this.httpClient.get<{types: SchemaTypeModel[]; all: SchemaAllTypeModel[]}>(
        `/${encodeURIComponent(stream)}/schema`,
        {
          params,
          headers: {customError: 'true'},
        },
      ),
      1000,
    );
  }
}
