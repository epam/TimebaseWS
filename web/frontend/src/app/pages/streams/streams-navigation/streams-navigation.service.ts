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

  url(item: MenuItem, activeTabType: string, reverseViewIsDefault: boolean): string[] {
    if (!item || item.type === MenuItemType.group) {
      return null;
    }

    if (activeTabType === 'chart' && item.meta.symbol) {
      return ['chart'];
    }
    const isTopic = item.type === MenuItemType.topic;
    const isSchemaTab = activeTabType === 'schema' || activeTabType === 'schema-edit';

    const topicName = item.id + (isSchemaTab ? '' : '#topic#');
    
    return [
      ...this.routePrefix(activeTabType, !!item.meta.symbol, !!item.meta.chartType.length, isTopic, reverseViewIsDefault),
      ...[item.meta.stream?.id, item.meta.symbol, isTopic ? topicName : ''].filter(Boolean),
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
    const isTopic = item.type === MenuItemType.topic ? true : '';
    
    params['name'] = !item.meta.symbol ? item.name : item.meta.stream.name;
    params['isView'] = item.meta.isView ? '1' : '';
    params['isTopic'] = isTopic;

    if (item.meta.space) {
      params['space'] = item.meta.space?.id || '';
    }
    if (activeTabType === 'chart' && item.meta.symbol) {
      params['space'] = item.meta.space?.id ?? null;
      if (isTopic) {
        params['stream'] = item.id + '#topic#';
      } else {
        params['stream'] = item.meta.stream.id; 
      }
      params['symbol'] = item.meta.symbol;
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
    delete itemParams['name'];
    delete itemParams['isView'];
    delete itemParams['isTopic'];

    return (
      routerUrl.startsWith(`${itemUrl}/`) &&
      JSON.stringify(routerParams) === JSON.stringify(itemParams)
    );
  }

  private routePrefix(activeTabType: string, hasSymbol: boolean, hasChartTypes: boolean, isTopic: boolean, reverseViewIsDefault: boolean) {
    let activeTabName: string;
    if (isTopic && ['schema-edit', 'schema'].includes(activeTabType)) {
      activeTabName = 'schema';
    } else if (!isTopic && ['stream-create', 'schema'].includes(activeTabType)) {
      activeTabName = 'schema-edit';
    } else if (activeTabType !== 'live' && isTopic) {
      activeTabName = 'live';
    } else {
      activeTabName = activeTabType;
    }

    const key = `${activeTabName}-${hasSymbol}-${hasChartTypes}-${reverseViewIsDefault}`;
    if (!this.routeStartCache.get(key)) {
      this.routeStartCache.set(key, [
        '/',
        appRoute,
        hasSymbol ? 'symbol' : 'stream',
        this.openDefault(activeTabName, hasSymbol, hasChartTypes) ? 
          (isTopic ? 'live' : (reverseViewIsDefault ? 'reverse' : 'view')) : activeTabName,
      ]);
    }

    return this.routeStartCache.get(key);
  }

  private openDefault(activeTabType: string, hasSymbol: boolean, hasChartTypes: boolean): boolean {
    return (
      this.hasNoCurrentView(activeTabType, hasSymbol, hasChartTypes) ||
      !activeTabType ||
      ['query', 'flow', 'orderBook', 'generateDDL'].includes(activeTabType)
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
