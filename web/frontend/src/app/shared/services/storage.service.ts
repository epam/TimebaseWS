import { Injectable } from '@angular/core';
import { TabModel } from '../../pages/streams/models/tab.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StorageService {

  getTabs(): TabModel[] {
    return this.getData(`${environment.config.version}_gridTabs`, []);
  }

  setPreviousActiveTab(tab?: TabModel) {
    this.setData('prevActTab', tab);
  }

  getPreviousActiveTab(): TabModel {
    return this.getData<TabModel>('prevActTab');
  }

  setGridState(tabName: string, state: object): void {
    this.setData(`gridStateLS${tabName}`, state);
  }

  removeGridState(tabName: string): void {
    localStorage.removeItem(`gridStateLS${tabName}`);
  }

  setQueryFilter(tabId: string, data: object): void {
    this.setData(`queryFilter${tabId}`, data);
  }

  getQueryFilter(tabId: string): object {
    return this.getData(`queryFilter${tabId}`);
  }

  getGridState(tabName: string): void {
    return this.getData(`gridStateLS${tabName}`);
  }

  getData<T>(key: string, defaultValue: T = null): T {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  }

  setData(key: string, value: object) {
    localStorage.setItem(key, value ? JSON.stringify(value) : null);
  }
}
