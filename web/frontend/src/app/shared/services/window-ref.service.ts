import { Injectable } from '@angular/core';

function _window(): any {
  // return the global native browser window object
  return window;
}

@Injectable({
  providedIn: 'root',
})
export class WindowRef {
  Offline: any;

  get nativeWindow(): any {
    return _window();
  }
}
