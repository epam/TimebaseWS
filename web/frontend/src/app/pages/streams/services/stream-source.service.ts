import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StreamSourceService {

  private requestsInProgress = {};

  constructor(private httpClient: HttpClient) {}

  getAvailableSources(streams: string[]) {
    const encodedStreams = streams.map(stream => encodeURIComponent(stream));
    const params = { streams: encodedStreams };

    const cashKey = JSON.stringify(streams);
    if (this.requestsInProgress[cashKey]) {
      return this.requestsInProgress[cashKey];
    } else {
      this.requestsInProgress[cashKey] = this.httpClient.get('/availableSources', { params }).pipe(shareReplay(1));
      return this.requestsInProgress[cashKey];
    }
  }
}