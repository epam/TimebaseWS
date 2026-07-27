import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StreamSourceService {

  private requestsInProgress = {};

  constructor(private httpClient: HttpClient) {}

  getAvailableSources(streams: string[], tbId: string = null) {
    const encodedStreams = streams.map(stream => encodeURIComponent(stream));
    const params: { [key: string]: string | string[] } = { streams: encodedStreams };
    if (tbId) {
      params.tb = tbId;
    }

    const cashKey = JSON.stringify({ streams, tbId });
    if (this.requestsInProgress[cashKey]) {
      return this.requestsInProgress[cashKey];
    } else {
      this.requestsInProgress[cashKey] = this.httpClient.get('/availableSources', { params }).pipe(shareReplay(1));
      return this.requestsInProgress[cashKey];
    }
  }
}