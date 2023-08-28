import { Injectable }             from '@angular/core';
import { Router }                 from '@angular/router';
import { MenuItem, MenuItemType } from '../../../shared/models/menu-item';
import { appRoute }               from '../../../shared/utils/routes.names';

@Injectable({
  providedIn: 'root',
})
export class StreamsNavigationService {
  private hasNoCurrenViewCache = new Map<string, boolean>();
  private routeStartCache = new Map<string, string[]>();
  private paramsCache = new Map<string, object>();

  constructor(private router: Router) {}

  url(item: MenuItem, activeTabType: string): string[] {
    if (!item || item.type === MenuItemType.group) {
      return null;
    }
    
    return [
      ...this.routePrefix(activeTabType, !!item.meta.symbol, !!item.meta.chartType.length),
      ...[item.meta.stream?.id, item.meta.symbol].filter(Boolean),
    ];
  }

  params(item: MenuItem, activeTabType: string, forceNewTab = false): any {
    const key = `${activeTabType}-${item.meta.chartType?.join('_')}-${forceNewTab}-${
      item.meta.symbol
    }`;

    if (!this.paramsCache.has(key)) {
      this.paramsCache.set(
        key,
        this.paramsPrefix(activeTabType, item.meta.chartType, forceNewTab, !!item.meta.symbol),
      );
    }

    const params = {...this.paramsCache.get(key)};
    
    params['streamName'] = item.meta.stream.name;
    params['isView'] = item.meta.isView ? '1' : '';

    if (item.meta.space) {
      params['space'] = item.meta.space?.id || '';
    }

    return params;
  }

  private paramsPrefix(
    activeTabType,
    chartType: {chartType: string, title: string}[],
    forceNewTab: boolean,
    hasSymbol: boolean,
  ): any {
    const params = {};
    if (chartType) {
      params['chartType'] = chartType.map(ct => ct.chartType);
      params['chartTypeTitles'] = chartType.map(ct => ct.title);
    }

    if (forceNewTab || this.hasNoCurrentView(activeTabType, hasSymbol, !!chartType.length)) {
      params['newTab'] = 1;
    }
    return params;
  }

  urlIsActive(href: string) {
    if (!href) {
      return false;
    }
    const [routerUrl, routerParams] = this.parseUrl(this.router.routerState.snapshot.url);
    const [itemUrl, itemParams] = this.parseUrl(href);

    delete itemParams['chartType'];
    delete itemParams['chartTypeTitles'];
    delete itemParams['streamName'];
    delete itemParams['isView'];

    return (
      routerUrl.startsWith(`${itemUrl}/`) &&
      JSON.stringify(routerParams) === JSON.stringify(itemParams)
    );
  }

  private routePrefix(activeTabType: string, hasSymbol: boolean, hasChartTypes: boolean) {
    const key = `${activeTabType}-${hasSymbol}-${hasChartTypes}`;
    if (!this.routeStartCache.get(key)) {
      this.routeStartCache.set(key, [
        '/',
        appRoute,
        hasSymbol ? 'symbol' : 'stream',
        this.openDefault(activeTabType, hasSymbol, hasChartTypes) ? 'view' : activeTabType,
      ]);
    }

    return this.routeStartCache.get(key);
  }

  private openDefault(activeTabType: string, hasSymbol: boolean, hasChartTypes: boolean): boolean {
    return (
      this.hasNoCurrentView(activeTabType, hasSymbol, hasChartTypes) ||
      !activeTabType ||
      ['query', 'flow', 'orderBook'].includes(activeTabType)
    );
  }

  private hasNoCurrentView(
    activeTabType: string,
    hasSymbol: boolean,
    hasChartTypes: boolean,
  ): boolean {
    const key = `${activeTabType}-${hasSymbol}-${hasChartTypes}`;
    if (!this.hasNoCurrenViewCache.get(key)) {
      this.hasNoCurrenViewCache.set(
        key,
        this.countHasNoCurrentView(activeTabType, hasSymbol, hasChartTypes),
      );
    }

    return this.hasNoCurrenViewCache.get(key);
  }

  private countHasNoCurrentView(
    activeTabType: string,
    hasSymbol: boolean,
    hasChartTypes: boolean,
  ): boolean {
    const isChart = ['chart'].includes(activeTabType);

    if (hasSymbol && isChart && !hasChartTypes) {
      return true;
    }

    return hasSymbol ? ['schema', 'schema-edit'].includes(activeTabType) : isChart;
  }

  private parseUrl(urlString: string): [string, object] {
    const [url, paramsString] = urlString.split('?');
    const params = {};
    new URLSearchParams(paramsString).forEach((value, key) => (params[key] = value));
    return [url, params];
  }
}
