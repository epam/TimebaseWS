import { Injectable }                                    from '@angular/core';
import { StorageMap }                                    from '@ngx-pwa/local-storage';
import { Observable, Subject }                           from 'rxjs';
import { concatMap, debounceTime, map, switchMap, take } from 'rxjs/operators';

export interface LeftMenuStorageData {
  menuSmall?: boolean;
  paths?: { [index: string]: string[] };
  search?: string;
  treeView?: string;
  searchOptions?: {};
}

@Injectable({
  providedIn: 'root',
})
export class LeftSidebarStorageService {
  
  private update$ = new Subject<(data: LeftMenuStorageData) => LeftMenuStorageData>();
  private updateFinished$ = new Subject<void>();

  dropdownsOpened: string[] = [];
  
  constructor(private storageMap: StorageMap) {
    this.update$.pipe(
      concatMap((handler) => {
        return this.getStorage().pipe(
          switchMap((storage) => {
            return this.storageMap.set('leftMenu', handler(storage));
          }),
        );
      }),
      debounceTime(0),
    ).subscribe(() => this.updateFinished$.next());
  }
  
  getMenuSmall(): Observable<boolean> {
    return this.getStorage().pipe(map(data => !!data?.menuSmall));
  }
  
  setMenuSmall(menuSmall: boolean): void {
    this.updateStorage({menuSmall}).subscribe();
  }
  
  updateStorage(update: Partial<LeftMenuStorageData>): Observable<void> {
    this.update$.next(storage => {
      return {...(storage || {}), ...update};
    });
    
    return this.updateFinished$.pipe(take(1));
  }
  
  getStoragePaths(): Observable<string[]> {
    return this.getTreeView().pipe(switchMap(treeView => this.getStorage().pipe(map(data => data?.paths?.[treeView] || []))));
  }
  
  updatePath(callback: (paths: string[]) => string[]): Observable<void> {
    this.update$.next(storage => {
      const paths = callback(storage?.paths?.[storage.treeView] || []);
      storage['paths'] = {...storage.paths, [storage.treeView]: paths};
      return storage;
    });
    
    return this.updateFinished$.pipe(take(1));
  }
  
  updateStorageItem(key: string, value: unknown): void {
    this.update$.next((storage) => {
      storage[key] = value;
      return storage;
    });
  }
  
  getStorage(): Observable<LeftMenuStorageData> {
    return this.watchStorage().pipe(take(1));
  }
  
  watchStorage(): Observable<LeftMenuStorageData> {
    return this.storageMap.watch('leftMenu').pipe(
      map((storage: LeftMenuStorageData) => storage ? {...storage, treeView: storage.treeView || 'streams'} : {}),
    );
  }
  
  getTreeView(): Observable<string> {
    return this.getStorage().pipe(map(storage => storage?.treeView));
  }

  addOpenedDropdown(dropdownName: string) {
    this.dropdownsOpened = [...this.dropdownsOpened, dropdownName];
  }

  removeOpenedDropdown(dropdownName: string) {
    this.dropdownsOpened = this.dropdownsOpened.filter(openedDropdown => openedDropdown !== dropdownName);
  }
}
