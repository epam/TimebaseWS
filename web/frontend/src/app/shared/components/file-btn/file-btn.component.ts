import { Component, ElementRef, forwardRef, Input, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR }             from '@angular/forms';

@Component({
  selector: 'app-file-btn',
  templateUrl: './file-btn.component.html',
  styleUrls: ['./file-btn.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    multi: true,
    useExisting: forwardRef(() => FileBtnComponent),
  }],
})
export class FileBtnComponent implements ControlValueAccessor {
  @ViewChild('inputEl') private inputEl: ElementRef;
  @Input() accept: string[];
  @Input() classes: string;

  displayName: string;

  onChange(input: HTMLInputElement) {
    this.displayName = Array.from(input.files).map(file => file.name).join(', ');
    this.change(input.files);
  }

  registerOnChange(fn: (value: FileList) => void): void {
    this.change = fn;
  }

  registerOnTouched(fn: any): void {
  }

  writeValue(obj: any): void {
    this.displayName = '';
    if (this.inputEl) {
      this.inputEl.nativeElement.value = '';
    }
  }

  private change(value: FileList) {
  }
}
