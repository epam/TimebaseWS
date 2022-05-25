import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'objectMerge',
})
export class ObjectMergePipe implements PipeTransform {
  transform(value: object, ...objects: object[]): object {
    let result = {...value};
    objects.forEach((obj) => (result = {...result, ...obj}));
    return result;
  }
}
