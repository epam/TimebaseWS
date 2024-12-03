import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, Observable, forkJoin, of, concat } from 'rxjs';
import { map, switchMap, filter, tap, mapTo, distinctUntilChanged } from 'rxjs/operators';
import { WSService } from 'src/app/core/services/ws.service';
import { ImportProgress } from '../models/import-progress';
import { SchemaAllTypeModel, SchemaTypeModel } from 'src/app/shared/models/schema.type.model';
import { WriteMode } from 'src/app/shared/components/write-modes-control/write-mode';

@Injectable({
  providedIn: 'root'
})
export class ImportFromTextFileService {

  private uploadFileUrl = 'import/csv/init';
  private getPreviewUrl = 'import/csv/preview';
  private getPreviewBasedOnSettingsUrl = 'import/csv/getPreview';
  private getValidationUrl = 'import/csv/validate';
  private requestProcessUrl = 'import/csv/requestProcess';
  private uploadAllFilesUrl = 'import/csv/uploadChunk';
  private startImportUrl = 'import/csv/start';
  private stopImportUrl = 'import/cancel';
  private finishImportUrl = 'import/finish';
  private getSettingsUrl = 'import/csv/setting';
  private deletePreviewUrl = 'import/csv/preview';
  private validateMappingGeneralUrl = 'import/csv/validate/mapping';
  private getAllFileHeadersUrl = 'import/csv/headers';
  private getNewMappingUrl = 'import/csv/mapping';
  private getNewStreanSchemaUrl = 'import/csv/schema';
  private importSubscriptionUrl = 'user/topic/initImport/csv';  
  private progressSubscriptionUrl = 'user/topic/startImport/csv';
  private logUrl='import/csv/log';

  private previews = {};
  private totalSize: number = 0;
  private fileUploadedSize: number = 0;

  public mappingErrors = [];
  public uploadedFiles: File[] = [];
  public noUploadedFiles$ = new BehaviorSubject<boolean>(true);
  public streamSchema = [];
  public warning: string;

  public sessionId: string;
  public streamId: string;
  public streamIdSubject = new Subject<string>();
  public uploadingId: string = '';
  public validation = {};
  public validationSubject = new Subject();
  public mappingValidationSubject = new Subject<void>();

  public currentMappings = [];
  public originalMapping = [];
  public defaultTypeToKeywordMapping = {};
  public allSymbols: string[];

  public invalidSettings = new BehaviorSubject(false);
  public filesUploadingProgress$ = new BehaviorSubject<number>(0);

  public openedSettingsTab: string;
  public allSymbolsSelected: boolean = false;

  public changedMappingFields = new Set();
  public instrumentTypes = [];

  public previewReceived: boolean = false;
  public settingsReceived: boolean = false;

  public settings = {
    charset: "UTF-8",
    dataTimeFormat: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
    defaultMessageType: null,
    startTime: null,
    endTime: null,
    fileBySymbol: false,
    instrumentType: null,
    nullValues: [''],
    separator: ",",
    startImportRow: 2,
    strategy: "SKIP",
    streamKey: "",
    symbols: null,
    timeZone: null,
    typeToKeywordMapping: {},
    writeMode: WriteMode.rewrite,
    globalSorting: false,
  }
  public defaultSettings: typeof this.settings;
  public editedSettings: Partial<typeof this.settings> = {};
  public defaultSettingsSet = false;
  public settingsUpdated$ = new BehaviorSubject<boolean>(false);

  public keywordColumnMapped: boolean;
  public createdStreamSchema: { types: SchemaTypeModel[]; all: SchemaAllTypeModel[] };
  public schemaIsValid$ = new Subject<boolean>();
  public errorMessages = {};

  constructor(private http: HttpClient, private wsService: WSService) {

    this.streamIdSubject.pipe(
      filter(streamId => !!streamId),
      distinctUntilChanged(),
      switchMap(() => this.getStreamSchema())
    )
    .subscribe((val: any) => {
      this.streamSchema = [];
      val.types.forEach(streamType => {
        this.streamSchema.push({ name: streamType.name, id: streamType.name, hasChildren: true });
        for (let streamField of streamType.fields) {
          if (!streamField.static) {
            this.streamSchema.push({name: streamField.name, id: streamField.name, parentItem: streamType.name });
          }
        }
      })
    });
  }

  public initImport(streamId = this.streamId): Observable<string> {
    const formData = new FormData();
    formData.append('streamKey', streamId);
    return this.http.post<string>(this.uploadFileUrl, formData);
  }

  public getPreviews() {
    const chunkSize = 1024 * 1024;
    const observables = [];
    for (let file of this.uploadedFiles) {
      const formData = new FormData();
      let chunk;
      let fullFile;
      if (file.size > chunkSize) {
        chunk = file.slice(0, chunkSize);
        fullFile = false;
      } else {
        chunk = file;
        fullFile = true;
      }
      formData.append("file", chunk, file.name);
      formData.append("fullFile", fullFile);
      observables.push(
        this.http.post<string>(`${this.getPreviewUrl}/${this.sessionId}`, formData)
      );
    }
    return forkJoin(observables);
  }

  public getNewMapping() {
    const generalSettings = {
      ...this.settings,
      streamKey: this.streamId,
    }
    return this.http.post(`${this.getNewMappingUrl}/${this.sessionId}`, generalSettings);
  }

  public getPreviewBasedOnSettings(fileName: string) {
    if (this.previews[fileName]) {
      return of({
        headers: this.previews[fileName].headers,
        rows: this.previews[fileName].rows
      });
    } else {
      const params = {
        fileName,
      }
      const dto = {
        generalSettings: {
          ...this.settings,
          streamKey: this.streamId
        },
        mappings: this.currentMappings
      }
      return this.http.post(`${this.getPreviewBasedOnSettingsUrl}/${this.sessionId}`, dto, { params } )
        .pipe(map((preview: any[]) => {

          if (!this.previews[fileName]) {
            this.previews[fileName] = {};
            this.previews[fileName].headers = preview[0].map((column: string) => ({
                headerName: column,
                field: this.formatGridField(column)
              })
            )
  
            this.previews[fileName].rows = preview.slice(1).map(row => {
              const rowAsObject = {};
              for (let i = 0; i < this.previews[fileName].headers.length; i += 1) {
                rowAsObject[this.previews[fileName].headers[i].field] = row[i];
              }
              return rowAsObject;
            })
          }

          return {
            headers: this.previews[fileName].headers,
            rows: this.previews[fileName].rows
          };
        })
      )
    }
  }

  public deletePreview(fileNames: string[]) {
    if (this.sessionId) {
      if (fileNames.length <= 10) {
        const params = {
          filesName: fileNames
        }
        return this.http.delete(`${this.deletePreviewUrl}/${this.sessionId}`, {params});
      } else {
        const observables = [];
        for (let i = 0; i < fileNames.length; i += 10) {
          const fileNamesChunk = fileNames.slice(i, i + 10);
          const params = {
            filesName: fileNamesChunk
          }
          observables.push(this.http.delete(`${this.deletePreviewUrl}/${this.sessionId}`, {params}));
        }
        return forkJoin(observables);
      }
    } else {
      return of(null);
    }
  }

  public getAllFileHeaders() {
    const params = {
      separator: this.settings.separator,
      charset: this.settings.charset
    }
    return this.http.get(`${this.getAllFileHeadersUrl}/${this.sessionId}`, {params});
  }

  public getStreamSchema() {
    return this.http.get(`${this.streamId}/schema`);
  }

  public validateMappingGeneral() {
    const dto = {
      generalSettings: {
        ...this.settings,
        streamKey: this.streamId
      },
      mappings: this.currentMappings
    }
    return this.http.post(`${this.validateMappingGeneralUrl}/${this.sessionId}`, dto)
      .pipe(tap((res: any) => {
        const mappingError = res.find(item => item.validateResponse.status !== 'VALID');
        if (mappingError) {
          this.mappingErrors = res.filter(item => item.validateResponse.status !== 'VALID');
        } else {
          this.mappingErrors = [];
        }
      }))
  }

  public getSettings() {
    const params = {
      streamKey: this.streamId,
    }
    return this.http.get(`${this.getSettingsUrl}/${this.sessionId}`, {params});
  }

  public getFullValidation() {
    const dto = {
      generalSettings: {
        ...this.settings,
        streamKey: this.streamId,
      },
      mappings: this.currentMappings
    }
    return this.http.post(`${this.getValidationUrl}/${this.sessionId}`, dto);
  }

  private formatGridField(field: string) {
    return field.replace('.', '-').toLowerCase();
  }

  public setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  public endSession(eraseSessionId = true) {
    if (eraseSessionId) {
      this.uploadedFiles.length = 0;
      this.sessionId = null;
      this.streamId = null;
      this.streamIdSubject.next(this.streamId);
      this.validation = {};
      this.validationSubject.next(this.validation);
    }
    this.uploadingId = '';
    this.totalSize = 0;
    this.fileUploadedSize = 0;
    this.filesUploadingProgress$.next(0);
    this.defaultSettingsSet = false;
    this.errorMessages = {};
    this.previewReceived = false;
    this.createdStreamSchema = null;
    this.settingsReceived = false;
    this.editedSettings = {};
    this.invalidSettings.next(false);
    this.changedMappingFields.clear();
  }

  public setStreamId(streamId: string) {
    this.streamId = streamId;
    this.streamIdSubject.next(streamId);
  }

  public setSettings() {
    const payload = {
      generalSettings: {
        ...this.settings,
        streamKey: this.streamId,
      },
      mappings: this.currentMappings
    }
    return this.http.post(`${this.getSettingsUrl}/${this.sessionId}`, payload);
  }

  public sendFileSize() {
    const totalSize = this.uploadedFiles.reduce((acc, file) => acc + file.size, 0);
    const params = {
      totalSize
    }
    this.totalSize = totalSize;
    return this.http.post(`${this.requestProcessUrl}/${this.sessionId}`, null, { params } )
  }

  public uploadAllFiles() {
    const chunkSize = 1000000;
    const observables = [];
    for (let file of this.uploadedFiles) {
      const numberofChunks = Math.ceil(file.size/chunkSize);
      if (numberofChunks === 1) {
        const formData = new FormData();
        formData.append("file", file, file.name);
        formData.append("fullFileSize", file.size.toString());
        observables.push(
          this.http.post(`${this.uploadAllFilesUrl}/${this.sessionId}`, formData)
            .pipe(tap(() => {
              this.fileUploadedSize += file.size;
              const uploadingProgress = +(this.fileUploadedSize / this.totalSize).toFixed(2);
              this.filesUploadingProgress$.next(+uploadingProgress);
            }))
          );
      } else {
        let uploadedSize = 0;
        let start = 0;
        let end = start + chunkSize;
        const allFileChunks = [];
        for (let i = 0; i < numberofChunks; i++) {
          const chunk = file.slice(start, end);
          start += chunkSize;
          end = start + chunkSize;
          const formData = new FormData();
          formData.append("file", chunk, file.name);
          formData.append("fullFileSize", file.size.toString());
          allFileChunks.push(
            this.http.post(`${this.uploadAllFilesUrl}/${this.sessionId}`, formData)
              .pipe(tap(() => {
                uploadedSize += chunkSize;
                if (uploadedSize < file.size) {
                  this.fileUploadedSize += chunkSize;
                } else {
                  this.fileUploadedSize += (file.size - chunkSize * i);
                }
                const uploadingProgress = +(this.fileUploadedSize / this.totalSize).toFixed(2);
                this.filesUploadingProgress$.next(+uploadingProgress);
              }))
          );
        }
      observables.push(concat(...allFileChunks));
      }
    }
    return forkJoin(observables);
  }

  public startImport() {
    const dto = {
      generalSettings: {
        ...this.settings,
        streamKey: this.streamId,
      },
      mappings: this.currentMappings
    }
    return this.http.post(`${this.startImportUrl}/${this.sessionId}`, dto);
  }

  public updateSettings(key: string, value, saveInStorage = false) {

    this.settings = {
      ...this.settings,
      [key]: value
    }

    this.previews = {};

    if (saveInStorage) {
      if (!this.editedSettings) {
        this.editedSettings = {};
      }
      this.editedSettings[key] = value;
      this.settingsUpdated$.next(false);
    }
  }

  public onUploadProgress(): Observable<ImportProgress> {
    return this.wsService
      .watch(`/${this.progressSubscriptionUrl}/${this.sessionId}`)
      .pipe(
        map(({body}) => JSON.parse(body)));
  }

  public onImportProgress() {
    return this.wsService.watch(`/${this.importSubscriptionUrl}/${this.sessionId}`);
  }

  public getUploadDetails() {
    return this.http.get(`${this.logUrl}/${this.sessionId}`, {
      responseType: 'blob',
    });
  }

  public onSocketClosed() {
    return this.wsService.socketDisconnected();
  }

  public finishImport() {
    if (this.sessionId) {
      return this.http.post(`${this.finishImportUrl}/${this.sessionId}`, {}).pipe(mapTo(null));
    } else {
      return of(null);
    }
  }

  public stopImport() {
    return this.http.post(`${this.stopImportUrl}/${this.sessionId}`, {}).pipe(mapTo(null));
  }

  public updateSettingsValidation() {
    this.invalidSettings.next(Object.values(this.errorMessages).some(errText => errText !== ''));
  }

  public updateKeywordColumnMappedProp() {
    this.keywordColumnMapped = this.currentMappings.find(item => item.column && item.field.name === 'keyword');
  }

  public isTypeToKeyWordMappingsChanged(mapping = {}, defaultMapping, mappingRequest = false) {
    if (!mapping) {
      return false;
    }
    if (this.keywordColumnMapped || mappingRequest) {
      if (Object.keys(mapping).length !== Object.keys(defaultMapping).length) {
        return true;
      }
      return !!Object.keys(mapping).filter(key => mapping[key] !== defaultMapping[key]).length;
    } else {
      const defaultMappingAsArray = Object.entries(defaultMapping)[0];
      const mappingAsArray = Object.entries(mapping)[0];
      return defaultMappingAsArray[0] !== mappingAsArray?.[0] || defaultMappingAsArray[1] !== mappingAsArray?.[1];
    }
  }

  public getNewStreamSchema() {
    const params = {
      enumCheck: false,
      enumValuesCount: 20,
      enumRepeatRate: 10,
      staticCheck: false
    };
    return this.http.get(`${this.getNewStreanSchemaUrl}/${this.sessionId}`, { params });
  }

  public createStream(streamName: string, storageVersion: string, distributionFactor: number) {
    const params = {
      key: streamName,
      version: storageVersion,
      distributionFactor
    };
    if (!params.distributionFactor) {
      delete params.distributionFactor;
    }
    const { types, all } = this.createdStreamSchema;
    return this.http.post('/createStream',
      {
        types,
        all,
      },
      {
        params
      },
    );
  }

  public schemaIsValidAsObservable() {
    return this.schemaIsValid$.asObservable();
  }
  
  public deleteStream(streamKey: string) {
    return this.http.post(`${encodeURIComponent(streamKey)}/delete`, {});
  }
}