import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SchemaClassTypeModel } from 'src/app/shared/models/schema.class.type.model';

@Injectable({
  providedIn: 'root',
})
export class TopicService {

  public dataForCopyToStream;

  constructor(private http: HttpClient) {}

  getTopicList() {
    return this.http.get<string[]>('/topics');
  }

  createTopic(key: string, schema) {
    return this.http.post(
      '/topics',
      { key, schema },
    );
  }

  renameTopic(topicId: string, newTopicId: string) {
    return this.http.post(`/topics/${topicId}/rename/${newTopicId}`, null);
  }

  deleteTopic(topicId: string) {
    const params = { topicId: encodeURIComponent(topicId) };
    return this.http.delete(`/topics/${encodeURIComponent(topicId)}`, { params });
  }

  getTopicSchema(topicId: string) {
    return this.http.get<{types: SchemaClassTypeModel[]; all: SchemaClassTypeModel[]}>(
      `/topics/${encodeURIComponent(topicId)}/schema`,
      {
        params: {
          topicId: encodeURIComponent(topicId),
          tree: 'true',
        },
      },
    )
  }
}