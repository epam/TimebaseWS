import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ImportFromTextFileService } from '../../../services/import-from-text-file.service';
import { takeUntil } from 'rxjs/operators';
import { ConfirmationModalComponent } from '../../modals/confirmation-modal/confirmation-modal.component';
import { BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-set-up-parameters',
  templateUrl: './set-up-parameters.component.html',
  styleUrls: ['./set-up-parameters.component.scss']
})
export class SetUpParametersComponent implements OnInit {

  settingsButtonsList = ["General", "Types"];
  // , "Symbol"];
  openedSettings: string;
  selectedFiles: File[];
  defaultSettingsButtonDisabled = new BehaviorSubject(false);
  private destroy$ = new Subject();
  typeToKeywordMappingChangedProp: boolean;

  constructor(private importFromTextFileService: ImportFromTextFileService,
    private modalService: BsModalService) { }

  ngOnInit(): void {
    this.openSettings(this.importFromTextFileService.openedSettingsTab ?? this.settingsButtonsList[0]);
    this.openedSettings = this.importFromTextFileService.openedSettingsTab ?? this.settingsButtonsList[0];
    this.selectedFiles = this.importFromTextFileService.uploadedFiles;

    this.isDefaultSettingsButtonDisabled();

    this.importFromTextFileService.settingsUpdated
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.isDefaultSettingsButtonDisabled());

    this.importFromTextFileService.updateKeywordColumnMappedProp();

    if (!this.importFromTextFileService.keywordColumnMapped) {
      const defaultType = Object.entries(this.importFromTextFileService.settings.typeToKeywordMapping)[0];
      this.importFromTextFileService.updateSettings('defaultMessageType', defaultType[0]);
      this.importFromTextFileService.updateSettings('typeToKeywordMapping', { [defaultType[0]]: defaultType[1] } );
    }

    if (this.importFromTextFileService.settings.fileBySymbol) {
      const symbolFieldMapping = this.importFromTextFileService.currentMappings
        .find(mapping => mapping.column && mapping.field.name === 'symbol');
      if (symbolFieldMapping) {
        symbolFieldMapping.column = null;
        this.importFromTextFileService.currentMappings = [
          ...this.importFromTextFileService.currentMappings.filter(mapping => mapping.field.name !== 'symbol'),
          symbolFieldMapping
        ]
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get warning() {
    return this.importFromTextFileService.warning;
  }

  openSettings(settingsType: string) {
    this.importFromTextFileService.openedSettingsTab = settingsType;
    this.openedSettings = settingsType;
  }

  isDefaultSettingsButtonDisabled() {
    const savedMapping = JSON.parse(localStorage.getItem(`mapping-${this.importFromTextFileService.streamId}`));
    const savedSettings = JSON.parse(localStorage.getItem(`settings-${this.importFromTextFileService.streamId}`));
    const editedSettings = this.importFromTextFileService.editedSettings ?? {};
    const defaultSettings = this.importFromTextFileService.defaultSettings;

    this.typeToKeywordMappingChangedProp = editedSettings.typeToKeywordMapping && 
      this.importFromTextFileService.typeToKeyWordMappingsChanged(
        editedSettings.typeToKeywordMapping, defaultSettings.typeToKeywordMapping);

    const value = (!this.importFromTextFileService.defaultSettingsSet && 
      (!!Object.keys(savedMapping ?? {}).length || !!Object.keys(savedSettings ?? {}).length)) 
      || this.settingsEdited(editedSettings, defaultSettings)
      || !!this.importFromTextFileService.changedMappingFields.size;
    this.defaultSettingsButtonDisabled.next(!value);
  }

  settingsEdited(editedSettings, defaultSettings) {
    return Object.keys(editedSettings).some(key => {
      const changedValue = editedSettings[key];
      if (key === 'instrumentType') {
        return changedValue && changedValue[0] !== defaultSettings[key][0];
      }
      if (key === 'nullValues') {
        return this.interpretAsNullSettingAsString(changedValue) !== this.interpretAsNullSettingAsString(defaultSettings[key]);
      }
      if (key === 'typeToKeywordMapping') {
        return this.importFromTextFileService.typeToKeyWordMappingsChanged(
          editedSettings[key], defaultSettings[key]);
      }
      return changedValue && changedValue !== defaultSettings[key] && key !== 'defaultMessageType';
    })
  }

  interpretAsNullSettingAsString(nullValues: string[]) {
    return nullValues?.map((item: string) => item === '' ? 'Empty Cells' : item).join(', ')
  }


  openResetSettingsConfirmation() {
    this.modalService.show(ConfirmationModalComponent, {
      class: 'modal-sm',
      ignoreBackdropClick: true,
    });
  }


}