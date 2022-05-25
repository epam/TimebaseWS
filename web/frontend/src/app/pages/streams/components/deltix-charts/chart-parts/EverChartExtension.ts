import {ContainerBuilder} from '@deltix/hd.components-di';
import {IExtension} from '@deltix/hd.components-multi-app';
import {DeltixChartFeedService} from './detix-chart-feed.service';

export class EverChartExtension implements IExtension {
  constructor(private feed: DeltixChartFeedService) {}

  getName(): string {
    return 'feed';
  }

  processApp(containerBuilder: ContainerBuilder, parameters: any): void {
    return;
  }

  processGlobal(containerBuilder: ContainerBuilder): void {
    containerBuilder.set('feed', this.feed);
  }
}
