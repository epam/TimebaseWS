import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class OrderBookIdService {
  private lastId = 0;

  registerId(): number {
    return ++this.lastId;
  }
}
