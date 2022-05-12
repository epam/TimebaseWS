import {Pipe, PipeTransform} from '@angular/core';
import {MenuItem} from '../../../shared/models/menu-item';
import {StreamsNavigationService} from './streams-navigation.service';

@Pipe({
  name: 'streamsNavigationParams',
})
export class StreamsNavigationParamsPipe implements PipeTransform {
  constructor(private streamsNavigationService: StreamsNavigationService) {}

  transform(item: MenuItem, activeTabType: string, forceNewTab = false): any {
    return this.streamsNavigationService.params(item, activeTabType, forceNewTab);
  }
}
