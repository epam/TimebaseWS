import {Pipe, PipeTransform} from '@angular/core';
import {MenuItem} from '../../../shared/models/menu-item';
import {StreamsNavigationService} from './streams-navigation.service';

@Pipe({
  name: 'streamsNavigationUrl',
})
export class StreamsNavigationUrlPipe implements PipeTransform {
  constructor(private streamsNavigationService: StreamsNavigationService) {}

  transform(item: MenuItem, activeTabType: string, reverseViewIsDefault: boolean): any {
    return this.streamsNavigationService.url(item, activeTabType, reverseViewIsDefault);
  }
}
