import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SchemaEditorService {

  constructor(private http: HttpClient) {}

  addedClassNames = new Set<string>();
  removedClassNames = new Set<string>();
  editedFieldNames = new Set<string>();

  addBuiltInClass(key: string) {
    const params = { key };
    return this.http.get('/schema', { params });
  }

  clearEditedItems() {
    this.addedClassNames.clear();
    this.editedFieldNames.clear();
    this.removedClassNames.clear();
  }
}