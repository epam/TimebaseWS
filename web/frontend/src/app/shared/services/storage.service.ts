import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {TabModel} from '../../pages/streams/models/tab.model';

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

  setGridState(tabName: string, state: object): void {
    this.setData(`gridStateLS${tabName}`, state);
  }

  removeGridState(tabName: string): void {
    localStorage.removeItem(`gridStateLS${tabName}`);
  }

  setQueryFilter(tabId: string, data: object): void {
    this.setData(`queryFilter${tabId}`, data);
  }

  getQueryFilter(tabId: string): {query: string} {
    return this.getData(`queryFilter${tabId}`);
  }

  setExecutedQuery(tabId: string, data: object): void {
    this.setData(`executedQuery${tabId}`, data);
  }

  getExecutedQuery(tabId: string): string {
    return this.getData(`executedQuery${tabId}`);
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

  getPreviousActiveTab(): TabModel {
    return this.getData<TabModel>('prevActTab');
  }
}
