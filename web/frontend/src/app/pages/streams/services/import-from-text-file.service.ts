import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Observable, forkJoin, of, concat } from 'rxjs';
import { map, switchMap, filter, tap, mapTo, first } from 'rxjs/operators';
import { WSService } from 'src/app/core/services/ws.service';
import { GlobalFiltersService } from 'src/app/shared/services/global-filters.service';
import { ImportProgress } from '../models/import-progress';
import JSZip from 'jszip';

@Injectable({
  providedIn: 'root'
})
export class ImportFromTextFileService {

  uploadFileUrl = 'import/csv/init';
  getPreviewUrl = 'import/csv/preview';
  getPreviewBasedOnSettingsUrl = 'import/csv/getPreview';
  getMappingUrl = 'import/csv/mapping';
  getValidationUrl = 'import/csv/validate';
  requestProcessUrl = 'import/csv/requestProcess';
  uploadAllFilesUrl = 'import/csv/uploadChunk';
  startImportUrl = 'import/csv/start';
  stopImportUrl = 'import/cancel';
  finishImportUrl = 'import/finish';
  getSettingsUrl = 'import/csv/setting';
  deletePreviewUrl = 'import/csv/preview';
  validateMappingGeneralUrl = 'import/csv/validate/mapping';
  getAllFileHeadersUrl = 'import/csv/headers';
  getNewMappingUrl = 'import/csv/mapping';

  mappingInvalid = new Subject();
  mappingErrors = [];

  uploadedFiles: File[] = [];
  noUploadedFiles = new BehaviorSubject<boolean>(true);
  previewFileName: string;
  headers = [];
  streamSchema = [];
  warning: string;

  sessionId: string;
  sessionIdSubject = new Subject<string>();
  streamId: string;
  streamIdSubject = new Subject<string>();
  uploadingId: string = '';
  csvFileHeaders = [];
  csvFileRows = [];
  streamFieldsDropdown = {};
  fileId: string;
  streamFields = [];
  mapping = [];
  validation = {};
  validationSubject = new Subject();
  mappingValidationSubject = new Subject<void>();

  currentMappings = [];
  originalMapping = [];
  defaultTypeToKeywordMapping = {};
  allSymbols: string[];

  headerDropdownIsOpen: boolean = false;
  invalidSettings = new BehaviorSubject(false);

  previews = {};
  totalSize: number = 0;
  fileUploadedSize: number = 0;
  filesUploadingProgress$ = new BehaviorSubject<number>(0);

  openedSettingsTab: string;
  allSymbolsSelected: boolean = false;

  changedMappingFields = new Set();
  instrumentTypes = [];

  previewReceived: boolean = false;
  settingsReceived: boolean = false;

  settings = {
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
    streamKey: "bbos2",
    symbols: null,
    timeZone: null,
    typeToKeywordMapping: {},
    writeMode: "APPEND",
    globalSorting: false,
  }
  defaultSettings: typeof this.settings;
  editedSettings: Partial<typeof this.settings> = {};
  defaultSettingsSet = false;
  settingsUpdated = new BehaviorSubject<boolean>(false);
  keywordColumnMapped: boolean;

  errorMessages = {};

  constructor(private http: HttpClient, private wsService: WSService) {

    this.streamIdSubject.pipe(
      filter(streamId => !!streamId),
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

  initImport(): Observable<string> {
    const formData = new FormData();
    formData.append('streamKey', this.streamId);
    return this.http.post<string>(this.uploadFileUrl, formData);
  }

  getPreviews() {
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

  getNewMapping() {
    const generalSettings = {
      ...this.settings,
      streamKey: this.streamId,
    }
    return this.http.post(`${this.getNewMappingUrl}/${this.sessionId}`, generalSettings);
  }

  // getPreviewsGzip() {
  //   const gzip = require('gzip-js');
  //   const options = {
  //     level: 6,
  //     name: 'gzip-files',
  //     timestamp: Date.now()
  //   };
  //   const observables = [];
  //   const headers = new HttpHeaders( { 'Content-Encoding': 'gzip' } );

  //   for (let file of this.uploadedFiles) {
  //     const compressed = gzip.zip(file, options);

  //     const formData = new FormData();
  //     const fileObj = new File([compressed], file.name);
  //     formData.append("file", fileObj, file.name);
  //     formData.append("fullFile", 'true');

  //     observables.push(this.http.post(`${this.getPreviewUrl}/${this.sessionId}`, formData, {headers}));
  //   }
  //   return forkJoin(observables);
  // }


  getPreviewBasedOnSettings(fileName: string) {
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

  deletePreview(fileNames: string[]) {
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
  }

  getAllFileHeaders() {
    const params = {
      separator: this.settings.separator,
      charset: this.settings.charset
    }
    return this.http.get(`${this.getAllFileHeadersUrl}/${this.sessionId}`, {params});
  }

  getStreamSchema() {
    return this.http.get(`${this.streamId}/schema`);
  }

  getMapping() {
    const settings = {
      ...this.settings,
      streamKey: this.streamId,
    }
    return this.http.post(`${this.getMappingUrl}/${this.sessionId}`, settings);
  }

  validateMapping(fileName: string) {
    const dto = {
      generalSettings: {
        ...this.settings,
        streamKey: this.streamId
      },
      mappings: this.currentMappings
    }
    const params = {
      fileName
    }
    return this.http.post(`${this.getValidationUrl}/${this.sessionId}`, dto, {params});
  }

  validateMappingGeneral() {
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
        this.mappingInvalid.next(!!mappingError);
        if (mappingError) {
          this.mappingErrors = res.filter(item => item.validateResponse.status !== 'VALID');
        } else {
          this.mappingErrors = [];
        }
      }))
  }

  getSettings() {
    const params = {
      streamKey: this.streamId,
    }
    return this.http.get(`${this.getSettingsUrl}/${this.sessionId}`, {params});
  }

  getFullValidation() {
    const dto = {
      generalSettings: {
        ...this.settings,
        streamKey: this.streamId,
      },
      mappings: this.currentMappings
    }
    return this.http.post(`${this.getValidationUrl}/${this.sessionId}`, dto);
  }

  formatGridField(field: string) {
    return field.replace('.', '-').toLowerCase();
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
    this.sessionIdSubject.next(sessionId);
  }

  endSession(eraseSessionId = true) {
    if (eraseSessionId) {
      this.uploadedFiles.length = 0;
      this.sessionId = null;
      this.sessionIdSubject.next(null);
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
    this.settingsReceived = false;
    this.editedSettings = {};
    this.invalidSettings.next(false);
    this.changedMappingFields.clear();
  }

  setStreamId(streamId: string) {
    this.streamId = streamId;
    this.streamIdSubject.next(streamId);
  }

  sendFileSize() {
    const totalSize = this.uploadedFiles.reduce((acc, file) => acc + file.size, 0);
    const payload = {
      generalSettings: {
        ...this.settings,
        streamKey: this.streamId,
      },
      mappings: this.currentMappings,
      totalSize
    }
    const params = {
      totalSize
    }
    this.totalSize = totalSize;
    return this.http.post(`${this.requestProcessUrl}/${this.sessionId}`, payload, { params } );
  }

  // uploadGzip() {
  //   const gzip = require('gzip-js');
  //   const options = {
  //     level: 6,
  //     name: 'gzip-files',
  //     timestamp: Date.now()
  //   };
  //   const observables = [];

  //   const headers = new HttpHeaders( { 'Accept-Encoding': 'gzip' } );

  //   for (let file of this.uploadedFiles) {
  //     const compressed = gzip.zip(file, options);

  //     const formData = new FormData();
  //     const fileObj = new File([compressed], file.name);
  //     formData.append("file", fileObj, file.name);
  //     formData.append("fullFileSize", file.size.toString());

  //     observables.push(
  //       this.http.post(`${this.uploadAllFilesUrl}/${this.sessionId}`, formData, { headers } )
  //         .pipe(tap(() => {
  //           this.fileUploadedSize += file.size;
  //           const uploadingProgress = +(this.fileUploadedSize / this.totalSize).toFixed(2);
  //           this.filesUploadingProgress$.next(+uploadingProgress);
  //         }))
  //       );
  //   }
  //   return forkJoin(observables);
  // }

  uploadAllFiles() {
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

  startImport() {
    const dto = {
      generalSettings: {
        ...this.settings,
        streamKey: this.streamId,
      },
      mappings: this.currentMappings
    }
    return this.http.post(`${this.startImportUrl}/${this.sessionId}`, dto);
  }

  updateSettings(key: string, value, saveInStorage = false) {

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
      this.settingsUpdated.next(false);
    }
  }

  onUploadProgress(): Observable<ImportProgress> {
    return this.wsService
      .watch(`/user/topic/startImport/csv/${this.sessionId}`)
      .pipe(
        map(({body}) => JSON.parse(body)));
  }

  getUploadDetails() {
    return this.http.get(`import/csv/log/${this.sessionId}`, {
      responseType: 'blob',
      // headers: { 'Accept-Encoding': 'gzip' }
    });
  }

  onSocketClosed() {
    return this.wsService.socketDisconnected();
  }

  finishImport() {
    return this.http.post(`${this.finishImportUrl}/${this.sessionId}`, {}).pipe(mapTo(null));
  }

  stopImport() {
    return this.http.post(`${this.stopImportUrl}/${this.sessionId}`, {}).pipe(mapTo(null));
  }

  updateSettingsValidation() {
    this.invalidSettings.next(Object.values(this.errorMessages).some(errText => errText !== ''));
  }

  updateKeywordColumnMappedProp() {
    this.keywordColumnMapped = this.currentMappings.find(item => item.column && item.field.name === 'keyword');
  }

  typeToKeyWordMappingsChanged(mapping = {}, defaultMapping, mappingRequest = false) {
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
}