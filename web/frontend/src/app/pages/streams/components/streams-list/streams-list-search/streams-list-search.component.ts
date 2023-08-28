import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup }    from '@angular/forms';
import { ContextMenuService } from '@perfectmemory/ngx-contextmenu';
import equal                                       from 'fast-deep-equal/es6';
import { BsDropdownDirective }                     from 'ngx-bootstrap/dropdown';
import { Observable, of, ReplaySubject }           from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged, map,
  switchMap,
  takeUntil,
  tap,
}                                                  from 'rxjs/operators';
import {
  LeftMenuStorageData,
  LeftSidebarStorageService,
}                                                  from '../../../../../shared/services/left-sidebar-storage.service';

@Component({
  selector: 'app-streams-list-search',
  templateUrl: './streams-list-search.component.html',
  styleUrls: ['./streams-list-search.component.scss'],
})
export class StreamsListSearchComponent implements OnInit, OnDestroy {
  
  @ViewChild('searchDropDown', {read: BsDropdownDirective}) private searchDropDown: BsDropdownDirective;
  
  searchDropDownOpen = false;
  form: UntypedFormGroup;
  optionGroups = [
    {
      controlName: 'use',
      nullable: true,
      options: ['wildCards', 'regExps'],
    },
    {
      controlName: 'match',
      nullable: false,
      options: ['any', 'exactly'],
      default: 'any',
    },
  ];
  
  defaultConfig = {};
  hasChanges$: Observable<boolean>;
  
  private destroy$ = new ReplaySubject(1);
  
  constructor(
    private contextMenuService: ContextMenuService,
    private fb: UntypedFormBuilder,
    private leftSidebarStorageService: LeftSidebarStorageService,
  ) { }
  
  ngOnInit(): void {
    const optionsConfig = {};
    this.optionGroups.forEach(group => {
      group.options.forEach(option => {
        optionsConfig[group.controlName + option] = group.default === option;
      });
    });
    
    this.defaultConfig = optionsConfig;
    
    this.form = this.fb.group({
      text: null,
      options: this.fb.group(this.defaultConfig),
    });
    
    const mapStorageToForm = map((storage: LeftMenuStorageData) => {
      const patchOptions = {};
      this.optionGroups.forEach(group => group.options.forEach(option => {
        const storageVal = storage?.searchOptions?.[group.controlName];
        patchOptions[group.controlName + option] = storageVal ? storageVal === option : (group.default === option);
      }));
      return {patchOptions, storage};
    });
    
    this.hasChanges$ = this.leftSidebarStorageService.watchStorage().pipe(
      mapStorageToForm,
      map(({patchOptions}) => JSON.stringify(patchOptions) !== JSON.stringify(this.defaultConfig)),
    );
    
    this.leftSidebarStorageService.getStorage().pipe(
      mapStorageToForm,
      tap(({patchOptions, storage}) => {
        this.form.patchValue({
          text: storage.search || '',
          options: patchOptions,
        });
      }),
      switchMap(() => this.form.get('options').valueChanges),
      distinctUntilChanged(equal),
      takeUntil(this.destroy$),
    ).subscribe(() => {
      const options = {};
      this.optionGroups.forEach(group => {
        const selected = group.options.find(option => this.form.get(`options.${group.controlName + option}`).value);
        options[group.controlName] = selected || null;
      });
      
      let hasNullONNotNullable = false;
      this.optionGroups.forEach(group => {
        if (group.nullable) {
          return;
        }
        
        if (!group.options.find(option => this.form.get(`options.${group.controlName + option}`).value)) {
          hasNullONNotNullable = true;
        }
      });
      
      if (hasNullONNotNullable) {
        return of(null);
      }
      
      this.leftSidebarStorageService.updateStorageItem('searchOptions', options);
    });
    
    this.form.get('text').valueChanges.pipe(
      debounceTime(300),
      takeUntil(this.destroy$),
    ).subscribe((text) => this.leftSidebarStorageService.updateStorageItem('search', text));
  }
  
  onClearSearch() {
    this.form.get('text').patchValue('');
  }
  
  onSearchOptionsClickOutside() {
    this.searchDropDown.hide();
  }
  
  searchDropDownOpenChange(state: boolean) {
    this.searchDropDownOpen = state;
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  onOptionChange(group: { nullable: boolean; controlName: string; options: string[] }, option: string, event: Event) {
    const state = event.target['checked'];
    group.options.forEach(gOption => {
      const controlName = group.controlName + gOption;
      this.form.get('options').get(controlName).patchValue(group.nullable ? (gOption === option ? state : false) : gOption === option);
    });
  }
  
  clearOptions() {
    this.form.get('options').patchValue(this.defaultConfig);
  }

  onCloseContextMenu() {
    this.contextMenuService.closeAllContextMenus({eventType: 'cancel'});
  }

  closeOtherDropdowns() {
    if (this.leftSidebarStorageService.dropdownsOpened.includes('search-options-dropdown')) {
      this.leftSidebarStorageService.removeOpenedDropdown('search-options-dropdown');
    } else {
      this.leftSidebarStorageService.addOpenedDropdown('search-options-dropdown');
      this.onCloseContextMenu();
      if (this.leftSidebarStorageService.dropdownsOpened.includes('create-stream-dropdown')) {
        (document.querySelector('.create-stream-toggle-btn') as HTMLElement).click();
        this.leftSidebarStorageService.removeOpenedDropdown('create-stream-dropdown');
      }
    }
  }
}
