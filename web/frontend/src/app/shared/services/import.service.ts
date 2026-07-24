import {HttpClient, HttpEventType} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {interval, Observable, of, Subject, throwError} from 'rxjs';
import {catchError, filter, map, mapTo, switchMap, takeUntil, tap} from 'rxjs/operators';
import {WSService} from '../../core/services/ws.service';
import {ImportProgress, ImportProgressType} from '../../pages/streams/models/import-progress';
import { SchemaClassTypeModel } from '../models/schema.class.type.model';

@Injectable({
  providedIn: 'root',
})
export class ImportService {
  constructor(private httpClient: HttpClient, private wsService: WSService) {}

  startImport(data: object, tbId?: string): Observable<number> {
    const body = tbId ? {...data, tbId} : data;
    return this.httpClient.post<number>('/initImport', body);
  }

  importChunks(id: number, file: File, start = 0): Observable<number> {
    return new Observable((source) => {
      const unsubscribe$ = new Subject();
      this.loadChunk(id, file, start, (progress) => source.next(progress))
        .pipe(
          takeUntil(unsubscribe$),
          catchError((e) => {
            source.error(e);
            return throwError(e);
          }),
        )
        .subscribe(() => {
          source.complete();
        });
      return () => {
        unsubscribe$.next();
        unsubscribe$.complete();
      };
    });
  }

  getNewStreamSchema(uploadId: number) {
    return this.httpClient.get<{ types: SchemaClassTypeModel[]; all: SchemaClassTypeModel[] }>(`/import/schema/${uploadId}`);
  }

  checkDataLosses(uploadId: number, streamKey: string) {
    return this.httpClient.get(`/import/validateSchema/${uploadId}/${streamKey}`);
  }

  onUploadProgress(uploadId: number): Observable<ImportProgress> {
    return this.wsService
      .watch(`/user/topic/startImport/qsmsg/${uploadId}`)
      .pipe(map(({body}) => JSON.parse(body)));
  }

  onFileUploadProgress(uploadId: number): Observable<ImportProgress> {
    return this.wsService
      .watch(`/user/topic/initImport/qsmsg/${uploadId}`)
      .pipe(map(({body}) => JSON.parse(body)));
  }

  cancelImport(id: number): Observable<void> {
    return this.httpClient.post(`/cancelImport/${id}`, {}).pipe(mapTo(null));
  }

  private loadChunk(
    id: number,
    file: File,
    start: number,
    progressCallback: (progress: number) => void,
  ): Observable<boolean> {
    const chunkSize = 1024 * 1024 * 0.5;
    if (start > file.size) {
      return of(true);
    }

    progressCallback(start / file.size);

    const end = start + chunkSize + 1;
    const chunk = file.slice(start, end);
    const fd = new FormData();
    fd.set('file', chunk);
    fd.set('offset', start.toString());
    return this.httpClient
      .post(`/importChunk/${id}`, fd, {
        reportProgress: true,
        observe: 'events',
        headers: {customError: 'true'},
      })
      .pipe(
        filter((event) =>
          [HttpEventType.UploadProgress, HttpEventType.Response].includes(event.type),
        ),
        switchMap((event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const loadedSize = Math.min(chunkSize, file.size - start);
            progressCallback((start + loadedSize * (event.loaded / event.total)) / file.size);
          }

          if (event.type === HttpEventType.Response) {
            return this.loadChunk(id, file, end, progressCallback);
          }
          return of(null);
        }),
        filter((e) => !!e),
      );
  }
}
