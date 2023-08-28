import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { FileBtnComponent } from 'src/app/shared/components/file-btn/file-btn.component';
import { ImportFromTextFileService } from '../../../services/import-from-text-file.service';
import { takeUntil } from 'rxjs/operators';
import { FolderFiles } from 'src/app/shared/models/folder-files.model';

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss']
})
export class UploadFileComponent implements OnInit {

  uploading = false;
  form: UntypedFormGroup;
  fileAddingError: string = '';
  uploadedFileNames: string[] = [];
  uploadedFileNamesSorted: string[] = [];
  uploadedFilesDefaultOrder: string[] = [];
  sorting: string = 'none';
  formats = {
    csv: 'text/csv',
    txt: 'text/plain',
  };
  importingFormats = {
    'text/csv': true,
    'text/plain': true,
    'application/vnd.ms-excel': true
  };
  acceptFormats = ['.csv', '.txt'];

  private destroy$ = new ReplaySubject(1);

  @Input() stream: string;
  @Input() fileButtonsDisabled = false;

  @ViewChild(FileBtnComponent) private fileInput: FileBtnComponent;

  constructor(private fb: UntypedFormBuilder, private importFromTextFileService: ImportFromTextFileService) { }

  ngOnInit(): void {
    this.uploadedFileNames = this.importFromTextFileService.uploadedFiles.map(file => file.name);
    this.uploadedFilesDefaultOrder = [...this.uploadedFileNames];
    this.form = this.fb.group(
      {
        file: [null, Validators.required],
      }
    );
  }

  toggleFileFormat(formatKey: string, format: string) {
    const key = `.${formatKey}`;
    if (this.acceptFormats.includes(key)) {
      this.acceptFormats = this.acceptFormats.filter(f => f !== key);
    } else {
      this.acceptFormats = [...this.acceptFormats, key];
    }

    this.importingFormats[format] = !this.importingFormats[format];
    if (format === 'text/csv') {
      this.importingFormats['application/vnd.ms-excel'] = !this.importingFormats['application/vnd.ms-excel'];
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addFolderFiles(filesFromInput: FolderFiles) {
    this.addFiles(filesFromInput.files);
  }

  addFiles(files: FileList) {
    this.importFromTextFileService.previewReceived = false;
    let invalidFileFormat = false;
    let sameNameFiles = false;
    let nonTextFormat = false;
    const allTextFormatsAllowed = Object.values(this.importingFormats).every(item => !item);
    Array.from(files).forEach((file: File) => {
      if (!this.importingFormats[file.type] && !allTextFormatsAllowed) {
        invalidFileFormat = true;
        return;
      } else if (allTextFormatsAllowed && !(file.type.includes('text') || file.type.includes('excel'))) {
        nonTextFormat = true;
        return;
      }
      if (this.uploadedFileNames.includes(file.name)) {
        sameNameFiles = true;
        return;
      } else {
        this.fileAddingError = '';
        this.importFromTextFileService.uploadedFiles.push(file);
        this.uploadedFileNames.push(file.name);
        this.importFromTextFileService.noUploadedFiles.next(false);
      }
    })
    if (invalidFileFormat) {
      const allFormatsChecked = Object.values(this.importingFormats).every(item => item);
      this.fileAddingError = `Only ${this.importingFormats[this.formats.csv] ? '.csv' : ''}
        ${allFormatsChecked ? ' or ' : ''} 
        ${this.importingFormats[this.formats.txt] ? '.txt' : ''} files can be added. `;
    }
    if (nonTextFormat) {
      this.fileAddingError = 'Only text files can be added. ';
    }
    if (sameNameFiles) {
      this.fileAddingError += 'Multiple files with the same name cannot be added.';
    }
    setTimeout(() => this.fileAddingError = '', 10000);

    this.uploadedFilesDefaultOrder = [...this.uploadedFileNames];
    if (this.uploadedFileNamesSorted.length) {
      this.uploadedFileNamesSorted = this.uploadedFileNames.sort();
    }
    this.fileInput.clearFileInput();
  }

  removeUploadedFile(fileName: string) {
    this.importFromTextFileService.deletePreview([fileName])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.importFromTextFileService.previewReceived = false;
        this.importFromTextFileService.uploadedFiles = this.importFromTextFileService.uploadedFiles
          .filter(file => file.name !== fileName);
        this.uploadedFileNames = this.uploadedFileNames.filter(name => name !== fileName);
        this.uploadedFilesDefaultOrder = [...this.uploadedFileNames];

        if (this.uploadedFileNamesSorted.length) {
          this.uploadedFileNamesSorted = this.uploadedFileNames.sort();
        }

        if (!this.uploadedFileNames.length) {
          this.importFromTextFileService.noUploadedFiles.next(true);
        }
      })
  }

  removeAllUploadedFiles() {
    this.importFromTextFileService.deletePreview(this.uploadedFileNames)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.importFromTextFileService.previewReceived = false;
        this.importFromTextFileService.uploadedFiles.length = 0;
        this.uploadedFileNames.length = 0;
        this.uploadedFilesDefaultOrder.length = 0;
        this.uploadedFileNamesSorted.length = 0;
        this.importFromTextFileService.noUploadedFiles.next(true);
        this.fileAddingError = '';
      })
  }

  toggleSortingType() {
    const sortingTypes = ['none', 'ascending', 'descending'];
    const currentSortingIndex = sortingTypes.findIndex(item => item === this.sorting);
    if (currentSortingIndex === sortingTypes.length - 1) {
      this.sorting = sortingTypes[0];
    } else {
      this.sorting = sortingTypes[currentSortingIndex + 1];
    }

    switch (this.sorting) {
      case 'none': 
        this.uploadedFileNamesSorted.length = 0;
        break;
      case 'ascending':
        this.uploadedFileNamesSorted = [...this.uploadedFileNames.sort()];
        break;
      case 'descending':
        this.uploadedFileNamesSorted = [...this.uploadedFileNames.sort().reverse()];
    }
  }
}