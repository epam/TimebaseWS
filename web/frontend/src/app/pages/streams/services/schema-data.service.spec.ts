import { TestBed } from '@angular/core/testing';

import { SchemaDataService } from './schema-data.service';

describe('SchemaDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SchemaDataService = TestBed.get(SchemaDataService);
    expect(service).toBeTruthy();
  });
});
