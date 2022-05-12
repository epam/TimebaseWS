import {Pipe, PipeTransform} from '@angular/core';
import {MenuItem, MenuItemType} from '../../../shared/models/menu-item';
import {appRoute} from '../../../shared/utils/routes.names';
import {StreamsNavigationService} from './streams-navigation.service';

@Pipe({
  name: 'streamsNavigationUrl',
})
export class StreamsNavigationUrlPipe implements PipeTransform {
  constructor(private streamsNavigationService: StreamsNavigationService) {}

  transform(item: MenuItem, activeTabType: string): any {
    return this.streamsNavigationService.url(item, activeTabType);
  }
}
