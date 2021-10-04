import { FormControl } from '@angular/forms';
import { Observable }  from 'rxjs';
import { map }         from 'rxjs/operators';

export function uniqueName(existing$: Observable<string[]>): (control: FormControl) => Observable<any> {
  return (control: FormControl) => {
    return existing$.pipe(map(names => {
      if (names.some(name => control.value === name)) {
        return {'nameIsForbidden': true};
      }
      
      return null;
    }));
  };
}
