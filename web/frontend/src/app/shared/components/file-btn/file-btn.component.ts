import {Component, ElementRef, forwardRef, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import { FolderFiles } from '../../models/folder-files.model';

@Component({
  selector: 'app-file-btn',
  templateUrl: './file-btn.component.html',
  styleUrls: ['./file-btn.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => FileBtnComponent),
    },
  ],
})
export class FileBtnComponent implements ControlValueAccessor {
  @Input() accept: string[];
  @Input() classes: string;
  @Input() maxFileNameLength = 30;
  @Input() importMultiple: boolean = false;
  @Input() showFileNames: boolean = true;
  @Input() folderInput: boolean = false;
  @Input() inputDisabled: boolean = false;

  @Output() addFilesToList = new EventEmitter<FileList>();
  @Output() addFolderToList = new EventEmitter<FolderFiles>();

  displayName: string;
  @ViewChild('inputEl') private inputEl: ElementRef;
  @ViewChild('folderInputEl') private folderInputEl: ElementRef;

  onChange(input: HTMLInputElement, folder: boolean) {
    if (!this.showFileNames) {
      if (folder) {
        this.addFolderToList.emit({files: input.files, folder});
      } else {
        this.addFilesToList.emit(input.files);
      }
    }
    this.setDisplayName(input.files);
    this.change(input.files);
  }

  registerOnChange(fn: (value: FileList) => void): void {
    this.change = fn;
  }

  registerOnTouched(fn: any): void {}

  writeValue(fileList: FileList): void {
    this.setDisplayName(fileList);
    if (this.inputEl) {
      this.inputEl.nativeElement.value = fileList || '';
    }
  }

  clearFileInput() {
    this.inputEl.nativeElement.value = '';
    this.folderInputEl.nativeElement.value = '';
  }

  private setDisplayName(fileList: FileList) {
    this.displayName = fileList
      ? Array.from(fileList)
          .map((file) => {
            if (file.name.length < this.maxFileNameLength) {
              return file.name;
            }

            const partLength = Math.floor(this.maxFileNameLength / 2);
            return `${file.name.slice(0, partLength)}...${file.name.slice(-partLength)}`;
          })
          .join(', ')
      : '';
  }

  private change(value: FileList) {}
}
