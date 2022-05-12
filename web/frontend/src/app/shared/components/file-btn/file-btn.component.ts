import {Component, ElementRef, forwardRef, Input, ViewChild} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

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
  displayName: string;
  @ViewChild('inputEl') private inputEl: ElementRef;

  onChange(input: HTMLInputElement) {
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
  
  private setDisplayName(fileList: FileList) {
    this.displayName = fileList ? Array.from(fileList)
      .map((file) => file.name)
      .join(', ') : '';
  }

  private change(value: FileList) {}
}
