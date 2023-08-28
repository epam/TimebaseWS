import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ImportFromTextFileService } from '../../../services/import-from-text-file.service';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss']
})
export class ConfirmationModalComponent implements OnInit {

  constructor(private bsModalRef: BsModalRef,
    private importFromTextFileService: ImportFromTextFileService) { }

  ngOnInit(): void {}

  cancel() {
    this.bsModalRef.hide();
  }

  resetToDefaultSettingsAndMappings() {
    this.importFromTextFileService.currentMappings = [ ...this.importFromTextFileService.originalMapping ];

    const noKeywordMapping = !this.importFromTextFileService.currentMappings
      .find(mapping => mapping.column && mapping.field.name === 'keyword');
    const defaultType = Object.entries(this.importFromTextFileService.defaultSettings.typeToKeywordMapping)[0];

    this.importFromTextFileService.settings = { 
      ...this.importFromTextFileService.defaultSettings,
      defaultMessageType: defaultType[0],
      typeToKeywordMapping: noKeywordMapping ? { [defaultType[0]]: defaultType[1] } : 
        { ...this.importFromTextFileService.defaultSettings.typeToKeywordMapping }
    }
    
    this.importFromTextFileService.defaultSettingsSet = true;
    this.importFromTextFileService.editedSettings = {};
    this.importFromTextFileService.changedMappingFields.clear();
    this.importFromTextFileService.errorMessages = {};
    this.importFromTextFileService.settingsUpdated.next(true);
    this.importFromTextFileService.invalidSettings.next(false);
    this.bsModalRef.hide();
    this.importFromTextFileService.warning = 
      "Import settings and field mappings have been reset to default values";
    setTimeout(() => this.importFromTextFileService.warning = "", 5000);
  }
}