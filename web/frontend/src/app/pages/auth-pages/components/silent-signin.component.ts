import { AfterViewInit, Component } from '@angular/core';

@Component({
  selector: 'app-silent-signin',
  template: '<p>loading...</p>',
  styleUrls: [],
  standalone: true,
})
export class SilentSigninComponent implements AfterViewInit {
  constructor() {}

  ngAfterViewInit(): void {
    const responseParameters = this.getRespParameters();
    const msg = this.makeMsg(responseParameters);
    const mainWin = this.getMainWindow();
    mainWin.postMessage(msg, window.location.origin);
  }
  private getRespParameters() {
    const responseParams = (window.location.hash === '' ? window.location.search : window.location.hash).substr(1);
    const params = new URLSearchParams(responseParams);

    const response = {};
    params.forEach((value: string, key: string) => {
      response[key] = value;
    });

    const expires_in = response['expires_in'];
    if (expires_in != null && !isNaN(expires_in)) {
      response['expires_in'] = +expires_in;
    }

    return response;
  }

  private makeMsg(parameters) {
    return {
      type: 'authorization_response',
      response: parameters,
    };
  }

  private getMainWindow() {
    return window.opener ? window.opener : window.parent;
  }
}
