import { Injectable }        from '@angular/core';
import { Observable }        from 'rxjs';
import { map }               from 'rxjs/operators';
import { TabStorageService } from '../../../../../shared/services/tab-storage.service';
import { SeSettings }        from '../models/se-settings';

@Injectable()
export class SeSelectionService {
  
  constructor(private tabStorageDataService: TabStorageService<SeSettings>,) {}
  
  onSelectType(typeUuid: string) {
    this.tabStorageDataService.updateDataSync(data => {
      data = data || {};
      data.selected = data.selected || {};
      data.selectedType = typeUuid;
      return data;
    });
  }
  
  onSelectField(typeUuid: string, fieldUUid: string) {
    this.tabStorageDataService.updateDataSync(data => {
      data = data || {};
      data.selected = data.selected || {};
      data.selected[typeUuid] = fieldUUid;
      return data;
    });
  }
  
  selectedType(): Observable<string> {
    return this.tabStorageDataService.getDataSync().pipe(map(data => data?.selectedType));
  }
  
  selectedField(typeUuid: string): Observable<string> {
    return this.tabStorageDataService.getDataSync().pipe(map(data => {
      return data?.selected && data.selected[typeUuid];
    }));
  }
}
