import {Component, Input, OnChanges} from '@angular/core';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss'],
})
export class ErrorComponent implements OnChanges {
  @Input() error: string;
  @Input() showCopyWhenNotCut = true;
  @Input() fullErrorText: string = '';

  shownError: string;
  btnTranslation: string;
  notificationMessage: string = '';

  ngOnChanges(): void {
    this.shownError = this.error?.slice(0, 200);
    this.btnTranslation = 'error.copy.' + (this.shownError !== this.error ? 'full' : 'error');
  }

  textCopiedToClipboard() {
    this.notificationMessage = 'Copied!';
    setTimeout(() => this.notificationMessage = '', 1500);
  }
}
