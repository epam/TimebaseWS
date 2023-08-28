import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ImportFromTextFileService } from '../../../services/import-from-text-file.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-grouped-parameters',
  templateUrl: './grouped-parameters.component.html',
  styleUrls: ['./grouped-parameters.component.scss']
})
export class GroupedParametersComponent implements OnInit {
  errorMessages = {};
  errorMessageList: string[];

  private destroy$ = new Subject();

  constructor(private importFromTextFileService: ImportFromTextFileService) { }

  ngOnInit(): void {
    this.getErrorMessages();
    this.importFromTextFileService.settingsUpdated
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.getErrorMessages());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setErrorMessages(mes) {
    this.importFromTextFileService.errorMessages = Object.assign(this.importFromTextFileService.errorMessages, mes);
    const allMessages = Object.values(this.errorMessages) as string[];
    this.errorMessageList = allMessages.filter(mes => mes !== '');
    this.importFromTextFileService.updateSettingsValidation();
  }

  getErrorMessages() {
    this.errorMessages = this.importFromTextFileService.errorMessages;
    const allMessages = Object.values(this.errorMessages) as string[];
    this.errorMessageList = allMessages.filter(mes => mes !== '');
  }
}