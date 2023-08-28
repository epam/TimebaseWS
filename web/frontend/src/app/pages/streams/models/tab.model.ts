import {streamRouteName, symbolRouteName} from '../../../shared/utils/routes.names';
import {ChartTypes} from './chart.model';
import {FilterModel} from './filter.model';
import {TabSettingsModel} from './tab.settings.model';

export class TabModel {
  public stream: string;
  public streamName: string;
  public symbol?: string;
  public space?: string;
  public id?: string;

  public name?: string;

  public active?: boolean;
  public live?: boolean;
  public monitor?: boolean;
  public reverse?: boolean;
  public view?: boolean;
  public isView?: boolean;
  public schema?: boolean;
  public schemaEdit?: boolean;
  public streamCreate?: boolean;
  public chart?: boolean;
  public query?: boolean;
  public flow?: boolean;
  public orderBook?: boolean;
  public chartType?: ChartTypes[];
  public chartTypeTitles?: string[];
  public streamRange?: {
    start: number;
    end: number;
  };

  public filter: FilterModel = {};
  public tabSettings: TabSettingsModel = {};
  public queryStream: string;
  public querySymbol: string;
  public queryInitialQuery: string;

  constructor(obj: {} | TabModel) {
    if (obj['stream']) {
      this.stream = obj['stream'];
    }
  
    if (obj['isView']) {
      this.isView = !!obj['isView'];
    }
  
    if (obj['streamName']) {
      this.streamName = obj['streamName'];
    }
    
    if (obj['streamRange']) {
      this.streamRange = obj['streamRange'];
    }

    if (obj['chartType']) {
      this.chartType = obj['chartType'];
    }
  
    if (obj['chartTypeTitles']) {
      this.chartTypeTitles = obj['chartTypeTitles'];
    }

    if (obj['symbol']) {
      this.symbol = obj['symbol'];
    }
    if (obj['space'] !== undefined) {
      this.space = obj['space'];
    }
    if (obj['id']) {
      this.id = obj['id'];
    }
    if (obj['name']) {
      this.name = obj['name'];
    }
    if (obj['active']) {
      this.active = obj['active'];
    }
    if (obj['live']) {
      this.live = obj['live'];
    }
    if (obj['monitor']) {
      this.monitor = obj['monitor'];
    }
    if (obj['reverse']) {
      this.reverse = obj['reverse'];
    }
    if (obj['view']) {
      this.view = obj['view'];
    }
    if (obj['schema']) {
      this.schema = obj['schema'];
    }
    if (obj['schemaEdit']) {
      this.schemaEdit = obj['schemaEdit'];
    }
    if (obj['streamCreate']) {
      this.streamCreate = obj['streamCreate'];
    }
    if (obj['chart']) {
      this.chart = obj['chart'];
    }
    if (obj['query']) {
      this.query = obj['query'];
    }
    if (obj['flow']) {
      this.flow = obj['flow'];
    }
    if (obj['filter']) {
      this.filter = obj['filter'];
    }
    if (obj['orderBook']) {
      this.orderBook = obj['orderBook'];
    }
    if (obj['tabSettings']) {
      this.tabSettings = obj['tabSettings'];
    }
    if (obj['queryStream']) {
      this.queryStream = obj['queryStream'];
    }
    if (obj['querySymbol']) {
      this.querySymbol = obj['querySymbol'];
    }
    if (obj['queryInitialQuery']) {
      this.queryInitialQuery = obj['queryInitialQuery'];
    }
  }

  public get title(): string {
    let title = this.orderBook ? '' : (this.streamName || this.name || this.stream);
    if (this.space !== undefined && !this.orderBook) title += ' / ' + (this.space || 'root');
    if (this.symbol && !this.orderBook) title += ' / ' + this.symbol;
    return title;
  }

  public get type(): string {
    switch (true) {
      case this.live:
        return 'live';
      case this.monitor:
        return 'monitor';
      case this.reverse:
        return 'reverse';
      case this.schema:
        return 'schema';
      case this.streamCreate:
        return 'stream-create';
      case this.schemaEdit:
        return 'schema-edit';
      case this.chart:
        return 'chart';
      case this.query:
        return 'query';
      case this.orderBook:
        return 'orderBook';
      case this.flow:
        return 'flow';
      case this.view:
      default:
        return 'view';
    }
  }

  public get linkQuery(): {[key: string]: string} {
    const QUERY = {};
    if (this.space !== undefined) QUERY['space'] = this.space;
    return QUERY;
  }

  public get linkArray(): string[] {
    const link_array =
      this.query || this.flow || this.orderBook
        ? []
        : [this.symbol ? symbolRouteName : streamRouteName];

    switch (true) {
      case this.live:
        link_array.push('live');
        break;
      case this.monitor:
        link_array.push('monitor');
        break;
      case this.reverse:
        link_array.push('reverse');
        break;
      case this.view:
        link_array.push('view');
        break;
      case this.schema:
        link_array.push('schema');
        break;
      case this.streamCreate:
        link_array.push('stream-create');
        break;
      case this.schemaEdit:
        link_array.push('schema-edit');
        break;
      case this.chart:
        link_array.push('chart');
        break;
      case this.query:
        link_array.push('query');
        break;
      case this.orderBook:
        link_array.push('order-book');
        break;
      case this.flow:
        link_array.push('flow');
        break;
    }

    if (this.stream && !this.orderBook) link_array.push(this.stream);
    if (this.symbol && !this.orderBook) link_array.push(this.symbol);
    if (this.id + '') link_array.push(this.id + '');

    return link_array;
  }
}
