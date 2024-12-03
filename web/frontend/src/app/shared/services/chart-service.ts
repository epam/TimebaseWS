import {Injectable}                                    from '@angular/core';
import { StorageService } from './storage.service';
import { BehaviorSubject } from 'rxjs';
import { StreamRenameService } from 'src/app/pages/streams/services/stream-rename.service';
import { MultiSelectItem } from '../components/multi-select/multi-select-item';

@Injectable({
  providedIn: 'root',
})
export class ChartService {

  public upperPadLineList: { [key: string]: string[] } = {};
  public lowerPadLineList: { [key: string]: string[] } = {};

  public scrollEnabled = true;

  private savedSymbolList: { [tabId: string]: string[] } = JSON.parse(localStorage.getItem("savedSymbolList")) ?? {};
  public openSymbols$ = new BehaviorSubject<{ [tabId: string]: string[] }>({});

  public streamTabs = {};
  public tabSymbolList = {};

  public updatedPeriodicity = {};

  public chartFilterFormTouched = new Set();

  constructor(private storageService: StorageService, private streamRenameService: StreamRenameService) {
    this.openSymbols$.next(this.savedSymbolList);

    this.streamRenameService
      .onSymbolRenamed()
      .subscribe(({streamId, oldName, newName}) => {
        const tabs = this.storageService.getTabs().map(tab => ({ id: tab.id, stream: tab.stream }) );
        tabs.forEach(tab => {
          if (tab.stream === streamId) {
            const tabSymbolList: string[] = this.getSavedSymbolList(tab.id);
            if (tabSymbolList.includes(oldName)) {
              const updatedSymbolList = [ ...tabSymbolList.filter(name => name !== oldName), newName];
              this.updateSavedSymbolList(tab.id, updatedSymbolList);
            }
          }
        })

        this.streamTabs[streamId].forEach((tabId: string) => {
          if (this.tabSymbolList[tabId]) {
            this.tabSymbolList[tabId] = [
              { id: newName, name: newName },
              ...this.tabSymbolList[tabId]
                .filter((symbol: MultiSelectItem)  => ![oldName, newName].includes(symbol.id))
            ];
          }
        });
      })
  }

  getAllSavedSymbols() {
    return JSON.parse(localStorage.getItem("savedSymbolList"));
  }

  getSavedSymbolList(tabId: string) {
    const savedList = JSON.parse(localStorage.getItem("savedSymbolList"));
    return savedList?.[tabId];
  }

  updateSavedSymbolList(tabId: string, list: string[]) {
    const tabIds = this.storageService.getTabs().map(tab => tab.id);

    Object.keys(this.savedSymbolList).forEach(key => {
      if (!tabIds.includes(key)) {
        delete this.savedSymbolList[key];
      }
    });

    this.savedSymbolList = { ...this.savedSymbolList, [tabId]: list };
    this.openSymbols$.next(this.savedSymbolList);
    localStorage.setItem("savedSymbolList", JSON.stringify(this.savedSymbolList));
  }

  getPadLines() {
    return JSON.parse(sessionStorage.getItem('linear-chart-pads'));
  }

  savePadLines() {
    sessionStorage.setItem('linear-chart-pads', JSON.stringify([this.upperPadLineList, this.lowerPadLineList]));
  }
}