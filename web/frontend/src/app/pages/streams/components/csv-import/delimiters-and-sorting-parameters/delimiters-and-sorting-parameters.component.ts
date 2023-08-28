import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ImportFromTextFileService } from '../../../services/import-from-text-file.service';
import { takeUntil, filter } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-delimiters-and-sorting-parameters',
  templateUrl: './delimiters-and-sorting-parameters.component.html',
  styleUrls: ['./delimiters-and-sorting-parameters.component.scss']
})
export class DelimitersAndSortingParametersComponent implements OnInit, OnDestroy {

  delimiters = [{title: 'Tab', symbol: '\u0009'}, {title: 'Comma', symbol: ','}, {title: 'Pipe', symbol: '|'}];
  formGroup: FormGroup;
  sortingIsEnabled: boolean = false;
  allSymbolsOptions: {name: string; id: string}[];
  selectedSymbols: {name: string; id: string}[];

  @ViewChild('delimiterAsText') delimiterAsText: ElementRef;

  @Output() toggleErrorMessage = new EventEmitter<{delimiterAsText: string}>();

  private destroy$ = new Subject<any>();

  constructor(private fb: FormBuilder, private importFromTextFileService: ImportFromTextFileService) { }

  ngOnInit(): void {
    const delimiter = this.importFromTextFileService.settings.separator;
    let customDelimiter = false;
    if (![',', '|', '\u0009'].includes(delimiter)) {
      customDelimiter = true;
    }

    const symbols = this.importFromTextFileService.allSymbols;
    this.allSymbolsOptions = this.mapOptionsForMultiSelect(symbols.filter(symbol => symbol.trim() !== ''));

    if (this.importFromTextFileService.settings.symbols) {
      this.selectedSymbols = this.mapOptionsForMultiSelect(this.importFromTextFileService.settings.symbols);
    } else if (this.importFromTextFileService.allSymbolsSelected) {
      this.selectedSymbols = this.allSymbolsOptions;
    }
    
    this.formGroup = this.fb.group({
      delimiter: [(customDelimiter ? 'other' : delimiter), Validators.required],
      delimiterAsText: [{ value: delimiter === '\u0009' ? '<TAB>' : delimiter, disabled: true }],
      fileBySymbol: this.importFromTextFileService.settings.fileBySymbol,
      symbols: '',
      globalSorting: this.importFromTextFileService.settings.globalSorting
    });

    this.importFromTextFileService.settingsUpdated
      .pipe(
        filter(updateFormData => updateFormData),
        takeUntil(this.destroy$))
      .subscribe(() => {
        const delimiter = this.importFromTextFileService.settings.separator;
        let customDelimiter = false;
        if (![',', '|', '\u0009'].includes(delimiter)) {
          customDelimiter = true;
        }

        if (this.importFromTextFileService.settings.symbols) {
          this.selectedSymbols = this.mapOptionsForMultiSelect(this.importFromTextFileService.settings.symbols);
        } else {
          this.selectedSymbols = [];
        }
        
        this.formGroup.patchValue({
          delimiter: customDelimiter ? 'other' : delimiter,
          delimiterAsText: delimiter === '\u0009' ? '<TAB>' : delimiter,
          fileBySymbol: this.importFromTextFileService.settings.fileBySymbol,
          symbols: '',
          globalSorting: this.importFromTextFileService.settings.globalSorting
        }, {emitEvent: false, onlySelf: true});
      })

    this.formGroup.get('delimiterAsText').valueChanges
      .pipe(takeUntil(this.destroy$)).subscribe(value => {
        if (this.formGroup.get('delimiter').value === 'other' && value && !value.match(/^[a-zA-Z0-9]{1}$/)) {
          this.toggleErrorMessage.emit( { delimiterAsText: 'Invaid Delimiter Value' } );  
        } else {
          this.toggleErrorMessage.emit( { delimiterAsText: '' } );
        }
        if (value) {
          this.importFromTextFileService.updateSettings('separator', value === '<TAB>' ? '\u0009' : value, true);
        }
      })

    this.formGroup.get('fileBySymbol').valueChanges
      .pipe(takeUntil(this.destroy$)).subscribe(value => {
        if (value) {
          const symbolFieldMapping = this.importFromTextFileService.currentMappings.find(mapping => mapping.column && mapping.field.name === 'symbol');
          if (symbolFieldMapping) {
            symbolFieldMapping.column = null;
            this.importFromTextFileService.currentMappings = [
              ...this.importFromTextFileService.currentMappings.filter(mapping => mapping.field.name !== 'symbol'),
              symbolFieldMapping
            ]
            this.importFromTextFileService.warning = "'Symbol' column-to-field mapping has been changed";
            setTimeout(() => this.importFromTextFileService.warning = "", 5000);
          }
        }
        
        this.importFromTextFileService.updateSettings('fileBySymbol', value, true);
      })

    this.formGroup.get('symbols').valueChanges
      .pipe(takeUntil(this.destroy$)).subscribe(value => {
        const symbolArray = value.map(item => item.name);
        const selectedSymbols = !symbolArray.length || symbolArray.length === this.allSymbolsOptions.length ? 
          null : symbolArray;
        this.importFromTextFileService.updateSettings('symbols', selectedSymbols, true);
        this.importFromTextFileService.allSymbolsSelected = symbolArray.length === this.allSymbolsOptions.length;
      });

    this.formGroup.get('globalSorting').valueChanges
      .pipe(takeUntil(this.destroy$)).subscribe(value => {
        this.importFromTextFileService.updateSettings('globalSorting', value, true);
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  settingEdited(key: string) {
    const changedValue = this.importFromTextFileService.editedSettings?.[key];
    return changedValue && changedValue !== this.importFromTextFileService.defaultSettings[key];
  }

  setDelimiterValue(event, symbol: string) {
    if (!event.target.checked) {
      return;
    }
    this.formGroup.controls['delimiterAsText'].setValue(symbol === '\u0009' ? '<TAB>' : symbol);
    this.formGroup.get('delimiterAsText').disable();
  }

  resetDelimiterValue(event) {
    if (!event.target.checked) {
      return;
    }
    this.formGroup.controls['delimiterAsText'].setValue('');
    this.formGroup.get('delimiterAsText').enable();
    this.delimiterAsText.nativeElement.focus();
  }

  setSortingIsEnabled(event) {
    this.sortingIsEnabled = event.target.checked;
  }

  mapOptionsForMultiSelect(options: string[]) {
    return options.map((option: string) => ({name: option, id: option}));
  }

  settingInvalid(key: string) {
    return this.importFromTextFileService.errorMessages?.[key];
  }
}