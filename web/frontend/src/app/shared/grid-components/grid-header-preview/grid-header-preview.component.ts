import {
  Component,
  ViewChild,
  ElementRef,
  OnInit
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IHeaderParams } from 'ag-grid-community';
import { ReplaySubject } from 'rxjs';
import { ImportFromTextFileService } from 'src/app/pages/streams/services/import-from-text-file.service';
import { tap, takeUntil, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-grid-header-preview',
  templateUrl: './grid-header-preview.component.html',
  styleUrls: ['./grid-header-preview.component.scss']
})
export class GridHeaderPreviewComponent implements OnInit {

  dropdownCommonItems = ['None', 'keyword', 'symbol', 'Instrument Type', 'Date/Time'];

  streamFieldMatched: string;
  streamFieldsDropdown = this.importFromTextFileService.streamFieldsDropdown;
  streamTypes = Object.keys(this.streamFieldsDropdown);
  openFieldType: string;
  displayName: string;
  variablesOpen: boolean = false;
  dropdownIsOpen: boolean = false;

  form: FormGroup;
  fieldList: { name: string; id: string; hasChildren?: boolean }[];
  selectedItem: string;
  lastUpdateWarning: number;

  private destroy$ = new ReplaySubject(1);

  @ViewChild('dropdown') dropdown: ElementRef;
  @ViewChild('toggleDropdownButton') toggleDropdownButton: ElementRef;

  constructor(private importFromTextFileService: ImportFromTextFileService, private fb: FormBuilder) {};

  ngOnInit() {
    const matchedItem = this.importFromTextFileService.currentMappings
      .find(item => item.column === this.displayName);

    if (!matchedItem) {
      this.streamFieldMatched = 'None';
    } else {
      this.streamFieldMatched = ['instrumentType', 'timestamp'].includes(matchedItem.field.name) ? 
        matchedItem.field.title : matchedItem.field.name;
    }
    this.setFieldList();
    this.form = this.fb.group({
      fields: this.streamFieldMatched,
    });
    this.selectedItem = this.streamFieldMatched;

    this.form.get('fields').valueChanges.subscribe(value => {
      this.selectedItem = value;
      const targetColumnIndex = this.importFromTextFileService.currentMappings.findIndex(item => item.column === this.displayName);
      if (targetColumnIndex > -1) {
        const targetMappingItem = this.importFromTextFileService.currentMappings[targetColumnIndex];
        this.importFromTextFileService.currentMappings[targetColumnIndex] = { ...targetMappingItem, column: null };
        this.importFromTextFileService.changedMappingFields.add(targetMappingItem?.field?.name);
      }

      if (value !== 'None') {
        const targetStreamIndex = this.importFromTextFileService.currentMappings
          .findIndex(item => item.field.name === value || item.field.title === value);

        const targetMappingItem = this.importFromTextFileService.currentMappings[targetStreamIndex];
        this.importFromTextFileService.currentMappings[targetStreamIndex] = { ...targetMappingItem, column: this.displayName };
        this.importFromTextFileService.changedMappingFields.add(targetMappingItem?.field.name);
      }

      const keywordColumnMapped = !!this.importFromTextFileService.currentMappings
        .find(item => item.column && item.field.name === 'keyword');
      if (!keywordColumnMapped) {
        const defaultType = Object.entries(this.importFromTextFileService.settings.typeToKeywordMapping)[0];
        this.importFromTextFileService.updateSettings('typeToKeywordMapping', { [defaultType[0]]: defaultType[1] } );
        this.setFieldList();
      }

      if (value === 'keyword') {
        this.setWarning("'Type To Keyword Mapping' setting has been changed");
        this.lastUpdateWarning = Date.now();
      }

      if (value === 'symbol') {
        this.importFromTextFileService.updateSettings('fileBySymbol', false, true);
        this.setWarning("'File by Symbol' setting has been changed");
      }

      if (value === 'Instrument Type') {
        this.setWarning("'Default Instrument type' setting selecting disabled");
      }

      this.importFromTextFileService.getFullValidation()
        .pipe(
          takeUntil(this.destroy$),
          tap((validation: any) => {
            this.importFromTextFileService.validation = validation;
            this.importFromTextFileService.validationSubject.next(validation);
          }),
          switchMap(() => this.importFromTextFileService.validateMappingGeneral()),
          tap(() => this.importFromTextFileService.mappingValidationSubject.next())
        )
        .subscribe();
    })
  }

  private setWarning(message: string) {
    this.importFromTextFileService.warning = message;
    setTimeout(() => {
      if (this.importFromTextFileService.warning === message || Date.now() - this.lastUpdateWarning > 4000) {
        this.importFromTextFileService.warning = "";
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  mappingChanged() {
    return this.importFromTextFileService.changedMappingFields.has(this.form.get('fields').value);
  }

  agInit(params: IHeaderParams): void {
    this.displayName = params.displayName;
  }

  setFieldList() {
    const mapTypes = Object.keys(this.importFromTextFileService.settings.typeToKeywordMapping);
    const mapSchema = this.importFromTextFileService.streamSchema
      .filter(item => mapTypes.includes(item.id) || mapTypes.includes(item.parentItem));

    this.fieldList = [
      ...this.dropdownCommonItems.map(item => ({name: item, id: item})),
      ...mapSchema,
    ];
  }
}