import { Pipe, PipeTransform } from '@angular/core';
import { StreamModel } from '../models/stream.model';
import { appRoute } from '../../../shared/utils/routes.names';

@Pipe({
  name: 'streamsNavigationUrl',
})
export class StreamsNavigationUrlPipe implements PipeTransform {

  transform(stream: StreamModel, activeTabType: string, openInNewTab: boolean, symbol?: string): any {
    if (this.disableUrl(activeTabType, symbol)) {
      return null;
    }

    const openDefault = !activeTabType || openInNewTab || activeTabType === 'query';

    return [
      '/',
      appRoute,
      (symbol ? 'symbol' : 'stream'),
      openDefault ? 'view' : activeTabType,
      stream.key,
      symbol,
    ].filter(Boolean);
  }

  private disableUrl(activeTabType: string, symbol: string) {
    return symbol ? ['schema', 'schema-edit'].includes(activeTabType) : activeTabType === 'chart';
  }
}
