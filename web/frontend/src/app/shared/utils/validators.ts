import {UntypedFormControl} from '@angular/forms';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

export function uniqueName(
  existing$: Observable<string[]>,
): (control: UntypedFormControl) => Observable<any> {
  return (control: UntypedFormControl) => {
    return existing$.pipe(
      map((names) => {
        if (names.some((name) => control.value === name)) {
          return {nameIsForbidden: true};
        }

        return null;
      }),
    );
  };
}

export function noSpecialSymbols() {
  const forbiddenSymbols = [' ', '\n', '\\', '/'];
  return (control: UntypedFormControl) => {
    if (forbiddenSymbols.find(symbol => control.value?.includes(symbol))) {
      return {specialSymbols: true};
    }
    
    return null;
  };
}
