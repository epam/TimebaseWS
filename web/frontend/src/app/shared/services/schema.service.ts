import { HttpClient }                          from '@angular/common/http';
import { Injectable }                          from '@angular/core';
import { SchemaAllTypeModel, SchemaTypeModel } from '../models/schema.type.model';
import { CacheRequestService }                 from './cache-request.service';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SchemaService {
  schema: { types: SchemaTypeModel[], all: SchemaTypeModel[] };
  constructor(private httpClient: HttpClient, private cacheRequestService: CacheRequestService) {}

  getSchema(stream: string, spaceId: string = null, tree = false, tbId: string = null) {
    const params = {
      ...(typeof spaceId === 'string'
        ? {
            space: encodeURIComponent(spaceId),
          }
        : {}),
      ...(tbId ? {tb: tbId} : {}),
    };

    if (tree) {
      params['tree'] = 'true';
    }
    return this.cacheRequestService.cache(
      {action: 'getSchema', stream, spaceId, tree, tbId},
      this.httpClient.get<{types: SchemaTypeModel[]; all: SchemaAllTypeModel[]}>(
        `/${encodeURIComponent(stream)}/schema`,
        {
          params,
          headers: {customError: 'true'},
        },
      ),
      1000,
    ).pipe(tap(schema => this.schema = schema));
  }
}
