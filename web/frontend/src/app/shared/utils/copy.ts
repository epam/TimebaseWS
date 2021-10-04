import { Observable } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';

export function copyToClipboard(text: string): Observable<void> {
  function manually(): void {
    const textArea = window.document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    window.document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      window.document.execCommand('copy');
    } catch (err) {
      document.body.removeChild(textArea);
      throw new Error('Was not possible to copy text: ' + JSON.stringify(err));
    }

    document.body.removeChild(textArea);
  }

  function viaNavigator(): Promise<void> {
    if (!window?.navigator?.permissions) {
      return Promise.reject();
    }

    return window.navigator.permissions.query({name: 'clipboard-write'}).then(result => {
      if (result.state === 'granted' || result.state === 'prompt') {
        return window.navigator.clipboard.writeText(text);
      } else {
        throw Error();
      }
    });
  }

  return fromPromise(viaNavigator().catch(() => manually()));
}

export function supportsReadFromClipboard(): boolean {
  return !!window.navigator.clipboard?.readText;
}

export function getClipboard(): Observable<string> {
  return fromPromise(
    window.navigator.permissions.query({name: 'clipboard-read'}).then(result => {
    if (result.state === 'granted' || result.state === 'prompt') {
      return window.navigator.clipboard.readText();
    } else {
      throw Error();
    }
  }));
}
