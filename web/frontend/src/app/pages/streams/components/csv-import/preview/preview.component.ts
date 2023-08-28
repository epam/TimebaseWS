import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReplaySubject, forkJoin, Subject } from 'rxjs';
import { map, takeUntil, tap, pluck, first, skip } from 'rxjs/operators';
import { ResizableService } from 'src/app/shared/services/resizable.servise';
import { defaultGridOptions } from 'src/app/shared/utils/grid/config.defaults';
import { ImportFromTextFileService } from '../../../services/import-from-text-file.service';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss']
})
export class PreviewComponent implements OnInit {

  formGroup: FormGroup;
  fileList: {name: string, id: string }[];
  colDefs = [];
  rowData: any;
  columnDefs: any;
  headers = [];
  fileHeaders: { [key: string]: string[] } = {};
  filesWithInvalidMapping = [];
  scrolledToInvalid = false;
  fileErrorDetails = {
    fileName: '',
    headers: [],
    text: {},
    errorMessages: {}
  };
  openedErrorList: string;
  notificationMessage: string = '';
  invalidMappings: string[];

  @ViewChild('errorDetails') errorDetails: ElementRef;
  private closeDropdown$ = new Subject();
  private destroy$ = new ReplaySubject(1);

  constructor(private importFromTextFileService: ImportFromTextFileService, private fb: FormBuilder,
    private resizableService: ResizableService) {}

  gridOptions = {
    ...defaultGridOptions,
    headerHeight: 60,
    defaultColDef: {
      width: 150,
      headerComponent: 'GridHeaderPreviewComponent',
    },
    rowBuffer: 10,
    enableFilter: true,
    enableSorting: true,
    suppressRowClickSelection: false,
    rowSelection: 'single',
    enableRangeSelection: true,
    suppressColumnVirtualisation: true,
    infiniteInitialRowCount: 1,
    maxConcurrentDatasourceRequests: 1,
    enableServerSideSorting: true,
    enableServerSideFilter: true,
    gridAutoHeight: false,
    stopEditingWhenGridLosesFocus: true,
    suppressCellSelection: true,
  }

  ngOnInit(): void {
    this.fileList = this.importFromTextFileService.uploadedFiles.map(file => ({name: file.name, id: file.name}));
    this.formGroup = this.fb.group({
      files: this.fileList[0].name,
    });

    this.invalidMappings = this.importFromTextFileService.mappingErrors.map(item => item.validateResponse.message);

    this.importFromTextFileService.mappingValidationSubject
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.invalidMappings = this.importFromTextFileService.mappingErrors.map(item => item.validateResponse.message);
      });

    this.importFromTextFileService.previewFileName = this.fileList[0].name;

    this.formGroup.get('files').valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.setGridData(value);
        this.importFromTextFileService.previewFileName = value;
      })

    this.importFromTextFileService.getFullValidation()
      .pipe(
        first(),
        takeUntil(this.destroy$)
      )
      .subscribe((validation: any) => {
        this.setGridData(this.fileList[0].name);
        this.importFromTextFileService.validation = validation;
        this.importFromTextFileService.validationSubject.next(this.importFromTextFileService.validation);
      });

    this.importFromTextFileService.validationSubject
      .pipe(takeUntil(this.destroy$))
      .subscribe(validation => {
        this.filesWithInvalidMapping = Object.keys(validation)
          .filter(key => Object.values(validation[key]).some((v: any) => Object.values(v.validateStatusMap)
          .some((item: any) => item.status === 'NON_VALID')));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setGridData(fileName: string) {
    this.importFromTextFileService.getPreviewBasedOnSettings(fileName)
      .pipe(
        first(), 
        map(res => {
          this.fileHeaders[fileName.replace('.', '_')] = res.headers;
          return {
             ...res, headers: this.addColumnStyle(res.headers, this.importFromTextFileService.validation)
            } 
          }),
        takeUntil(this.destroy$)
      )
      .subscribe(res => {
        this.columnDefs = res.headers;
        this.rowData = res.rows;
      });

    this.importFromTextFileService.validationSubject
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe(validation => {
        this.scrolledToInvalid = false;
        if (fileName === this.formGroup.get('files').value) {
          this.columnDefs = this.addColumnStyle(this.fileHeaders[fileName.replace('.', '_')], validation);
        }
      })
  }

  addColumnStyle(headers, validation) {
    const rowsWithInvalidMapping = new Set();
    Object.values(validation[this.formGroup.get('files').value] ?? {}).forEach((columnValidation: any) => {
      Object.entries(columnValidation.validateStatusMap).forEach(([key, value]) => {
        if ((value as any).status === 'NON_VALID') {
          rowsWithInvalidMapping.add(+key - 1);
        }
      });
    });

    return headers.map(header => ({
      ...header,
      cellStyle: (params) => {
        if (!this.importFromTextFileService.currentMappings.find(item => item.column === header.headerName)) {
          return { backgroundColor: 'rgba(100, 100, 100, 0.3)' };
        }

        const columnValidationStatus = validation[this.formGroup.get('files').value]?.[header.headerName]?.validateStatusMap;
        const cellValidation = columnValidationStatus ? columnValidationStatus[params.node.rowIndex + 1] : null;
        if (columnValidationStatus && Object.keys(columnValidationStatus).length && cellValidation) {
          if (cellValidation.status === 'NON_VALID' || cellValidation.status === 'CAN_SKIP') {
            return { backgroundColor: 'rgba(255, 99, 71, 0.3)' };
          }
        }
        
        const rowIndex = params.node.rowIndex;
        const startImportRow = this.importFromTextFileService.settings.startImportRow;

        if (rowsWithInvalidMapping.has(rowIndex) || startImportRow - 2 > rowIndex) {
          return { backgroundColor: 'rgba(100, 100, 100, 0.3)' };
        }
      }
    }))
  }

  get warning() {
    return this.importFromTextFileService.warning;
  }

  toggleErrorDetailsDropdown(fileName: string = '') {
    if (this.errorDetails.nativeElement.style.visibility === 'visible') {
      this.errorDetails.nativeElement.style.visibility = 'hidden';
      this.resizableService.childModalOpen = false;
      this.resizableService.parentResizeDisabled.next(false);
      this.closeDropdown$.next();
    }
    if (fileName && this.fileErrorDetails.fileName === fileName) {
      this.fileErrorDetails.fileName = '';
    } else if (fileName && this.fileErrorDetails.fileName !== fileName) {
      this.fileErrorDetails.fileName = fileName;
      this.errorDetails.nativeElement.style.visibility = 'visible';
      this.resizableService.parentResizeDisabled.next(true);
      this.resizableService.childModalOpen = true;
      this.fileErrorDetails.text = this.importFromTextFileService.validation[fileName];
      this.fileErrorDetails.headers = Object.keys(this.fileErrorDetails.text);
      for (let header of this.fileErrorDetails.headers) {
        this.fileErrorDetails.errorMessages[header] = 
          Object.entries(this.fileErrorDetails.text[header].validateStatusMap)
            .filter(([key, value]) => (value as any).message)
            .map(([key, value]) => ({ row: `Row ${key}:`, text: `${(value as any).message}`}))
      }
    }
  }

  toggleErrorList(header: string) {
    this.openedErrorList = this.openedErrorList === header ? '' : header;
  }

  copyAllWarnings() {
    let copiedString = `Filename: ${this.fileErrorDetails.fileName}\n`;
    for (let header of this.fileErrorDetails.headers) {
      if (this.fileErrorDetails.errorMessages[header].length) {
        copiedString += ` \nColumnname: ${header}\n`;

        for (let message of this.fileErrorDetails.errorMessages[header]) {
          copiedString += `${ message.row } ${ message.text }\n`;
        }
      }
    }
    navigator.clipboard.writeText(copiedString);
    this.notificationMessage = 'Copied!';
    setTimeout(() => this.notificationMessage = '', 1500);
  }
}