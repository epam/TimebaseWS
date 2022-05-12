import Big from 'big.js';
import { cloneDeepWith, range } from 'lodash';
import * as R from 'ramda';
import { startWith, pairwise, mergeMap, filter, pluck, tap, takeUntil, take, finalize, map, concatAll } from 'rxjs/operators';
import { pipe, fromEvent, merge } from 'rxjs';
import { getType, isCreator, binarySearch, uniqueArray, createRootReducer } from '@deltix/hd.components-utils';
import { separator, EAggregationTypes, levelsOnScreen, debugMode } from '@deltix/hd.components-common';
import { createStore, compose, applyMiddleware } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { namespace } from '@deltix/logger';

const LoggedOrderBookFeed = wrapped => ({
  subscribe(symbol, appId) {
    return wrapped.subscribe(symbol, appId).pipe(startWith(null), pairwise(), mergeMap(([prev, next]) => {
      if (null === prev) {
        return [next];
      }

      if (prev.sequence_number + 1 !== next.sequence_number) ;

      return [next];
    }));
  }

});

/**
 * Extract all action from provide channel.
 */

const fromChannelAction = c => pipe(filter(({
  channel
}) => channel === c), pluck("action"));

const insertOrderAction = (symbol, order, price, side, exchange, numberOfOrders) => ({
  type: '@ORDER_BOOK/INSERT_ORDER',
  payload: {
    symbol,
    order,
    side,
    exchange,
    price,
    numberOfOrders
  }
});
const updateOrderAction = (symbol, order, price, side, exchange, numberOfOrders) => ({
  type: '@ORDER_BOOK/UPDATE_ORDER',
  payload: {
    symbol,
    order,
    side,
    exchange,
    price,
    numberOfOrders
  }
});
const deleteOrderAction = (symbol, level, side, exchange) => ({
  type: '@ORDER_BOOK/DELETE_ORDER',
  payload: {
    symbol,
    level,
    side,
    exchange
  }
});
const deleteOrderFromAction = (symbol, level, side, exchange) => ({
  type: '@ORDER_BOOK/DELETE_FROM',
  payload: {
    symbol,
    level,
    side,
    exchange
  }
});
const deleteOrderThroughAction = (symbol, level, side, exchange) => ({
  type: '@ORDER_BOOK/DELETE_ORDER_THROUGH',
  payload: {
    symbol,
    level,
    side,
    exchange
  }
});
const snapshotAction = (symbol, orders, side, exchange) => ({
  type: '@ORDER_BOOK/SNAPSHOT',
  payload: {
    symbol,
    orders,
    side,
    exchange
  }
});
const tradeAction = (symbol, trade, timestamp, exchange) => ({
  type: '@ORDER_BOOK/TRADE',
  payload: {
    symbol,
    trade,
    timestamp,
    exchange
  }
});
const spawnChannelAction = (channel, symbol, parameters, epicType) => ({
  type: '@ORDER_BOOK/SPAWN_CHANNEL',
  payload: {
    channel,
    epicType,
    symbol,
    parameters
  }
});
const closeChannelAction = channel => ({
  type: '@ORDER_BOOK/CLOSE_CHANNEL',
  payload: {
    channel
  }
});
const updateChannelParametersAction = (symbol, channel, parameters) => ({
  type: '@ORDER_BOOK/UPDATE_CHANNEL_PARAMETERS',
  payload: {
    symbol,
    channel,
    parameters
  }
});
const subscribeAction = (symbol, parameters, channel) => ({
  type: '@ORDER_BOOK/SUBSCRIBE',
  payload: {
    symbol,
    parameters,
    channel
  }
});
/**
 * API
 */

const unsubscribeAction = symbol => {
  // unsubscribeValidator(symbol);
  return {
    type: '@ORDER_BOOK/UNSUBSCRIBE',
    payload: {
      symbol
    }
  };
};
const clearDeletedAction = () => ({
  type: '@ORDER_BOOK/CLEAR_DELETED'
});
const recordHoveredAction = (groupId, side, entity) => ({
  type: '@ORDER_BOOK/RECORD_HOVERED_ACTION',
  payload: {
    groupId,
    side,
    entity
  }
});
const noHoveredRecordsAction = groupId => ({
  type: '@ORDER_BOOK/NO_HOVERED_RECORDS_ACTION',
  payload: {
    groupId
  }
});
const packageAction = l2Package => ({
  type: '@ORDER_BOOK/PACKAGE',
  payload: {
    l2Package
  }
});
const dataHandledAction = symbol => ({
  type: '@ORDER_BOOK/DATA_HANDLED',
  payload: {
    symbol
  }
});
const aggregateByQuantityAction = symbol => ({
  type: '@ORDER_BOOK/AGGREGATE_BY_QUANTITY',
  payload: {
    symbol
  }
});
/**
 * API
 */

const calculateTradingAmountAction = amount => {
  // calculateTradingAmountValidator(amount);
  return {
    type: '@ORDER_BOOK/CALCULATE_AMOUNT',
    payload: {
      amount
    }
  };
};
/**
 * API
 */

const tradingAmountAction = amount => {
  // tradingAmountValidator(amount);
  return {
    type: '@ORDER_BOOK/AMOUNT',
    payload: {
      amount
    }
  };
};
var ELineType;

(function (ELineType) {
  ELineType["quantity"] = "quantity";
  ELineType["price"] = "price";
  ELineType["exchange"] = "exchange";
  ELineType["worst_price"] = "worst_price";
})(ELineType || (ELineType = {}));
/**
 * API
 */


const lineSelectedAction = (price, quantity, exchange, side, type) => {
  // lineSelectedValidator(price, quantity, exchange, side, type);
  return {
    type: '@COMMON/LINE_SELECTED',
    payload: {
      price,
      quantity,
      side,
      type,
      exchange
    }
  };
};

const getOrderBookSubscription = (state, symbol) => state.subscriptions[symbol];

const workerStream$ = worker => fromEvent(worker, "message").pipe(pluck("data"));

const fromMainTread = channel => workerStream$(self).pipe(fromChannelAction(channel));

const closeChannel$ = channelForSpawn => workerStream$(self).pipe(fromChannelAction(orderBookChannel), isCreator(closeChannelAction), filter(({
  payload: {
    channel: closeChannel
  }
}) => closeChannel === channelForSpawn), take(1));

const orderBookActionTypesWithSymbolActions = [insertOrderAction, updateOrderAction, snapshotAction, deleteOrderAction, deleteOrderFromAction, deleteOrderThroughAction, tradeAction, unsubscribeAction, dataHandledAction, tradingAmountAction];
const orderBookActionTypesWithSymbol = {};

for (const type of orderBookActionTypesWithSymbolActions) {
  orderBookActionTypesWithSymbol[getType(type)] = 1;
}

const serializer$1 = value => {
  if (value instanceof Big) {
    return value.toFixed();
  }
};

const filterBySymbol = onlyForSymbol => pipe(filter(action => {
  if (!(action.type in orderBookActionTypesWithSymbol)) {
    return true;
  }

  const {
    payload: {
      symbol
    }
  } = action;
  return symbol === onlyForSymbol;
}));

const spawnEpic = (action$, state$, {
  epic,
  outActionTypes
}, channelForSpawn, symbol, parameters) => {
  let actionStream$ = merge( // send to epic only actions with specified symbol
  action$.pipe(filterBySymbol(symbol)), fromMainTread(channelForSpawn));
  const dataSet = getOrderBookSubscription(state$.value, symbol); // emmit first action

  if (undefined !== dataSet) {
    // actionStream$ = merge(actionStream$, of(packageHandledAction(symbol, [])));
    actionStream$ = merge(actionStream$);
  }

  if (process.env.NODE_ENV === 'development') {
    if (epic == null) {
      throw new Error(`Invalid epic for spawn`);
    }
  }

  const map = {};

  for (const type of outActionTypes) {
    map[type] = 1;
  }

  return epic(actionStream$, state$, {
    symbol,
    parameters
  }).pipe(tap(action => {
    if (action.type in map) {
      self.postMessage(createChanelAction(channelForSpawn, cloneDeepWith(action, serializer$1)));
    }
  }), takeUntil(closeChannel$(channelForSpawn)));
};

const createChanelAction = (channel, action) => ({
  channel,
  action
});

const getWorkerChannelByType = (epicType, channels) => channels.find(c => c.epicType === epicType);

const workerRouterEpic = epicChannels => (action$, state$) => workerStream$(self).pipe(fromChannelAction(orderBookChannel), isCreator(spawnChannelAction), mergeMap(({
  payload: {
    channel,
    symbol,
    parameters,
    epicType
  }
}) => {
  return spawnEpic(action$, state$, getWorkerChannelByType(epicType, epicChannels), channel, symbol, parameters);
}));

const l2MessageSerialize = message => Object.assign(Object.assign({}, message), {
  price: message.price ? message.price.toString() : message.price,
  quantity: message.quantity ? message.quantity.toString() : message.quantity
});
const l2MessageUnSerialize = message => Object.assign(Object.assign({}, message), {
  price: message.price ? new Big(message.price) : message.price,
  quantity: message.quantity ? new Big(message.quantity) : message.quantity
});
const serializeL2Package = l2Package => {
  l2Package.entries = l2Package.entries.map(l2MessageSerialize);
  return l2Package;
};
const unSerializeL2Package = l2Package => {
  l2Package.entries = l2Package.entries.map(l2MessageUnSerialize);
  return l2Package;
};

const orderBookChannel = 'orderBook';
const serializer = value => {
  if (value instanceof Big) {
    return value.toFixed();
  }
};
class OrderBook {
  constructor(webSocketFeed, worker) {
    this.webSocketFeed = webSocketFeed;
    this.worker = worker;
    this.feedSubscriptions = {}; // decorate provide feed

    this.webSocketFeed = LoggedOrderBookFeed(this.webSocketFeed);
  }

  subscribe(symbol, parameters, channel, epicType, appId) {
    this.runWorker();
    const channels = this.feedSubscriptions[symbol] && this.feedSubscriptions[symbol].channels;

    if (channels !== undefined && channels.includes(channel)) {
      throw new Error(`Subscription for channel: ${channel} already exist. Chanel must be unique.`);
    }

    this.sendActionToOrderBookWorker(spawnChannelAction(channel, symbol, parameters, epicType));

    if (!this.feedSubscriptions.hasOwnProperty(symbol)) {
      const subscription = this.webSocketFeed.subscribe(symbol, appId) // send l2 data to worker
      .subscribe(data => this.sendActionToOrderBookWorker(packageAction(serializeL2Package(data))));
      this.feedSubscriptions[symbol] = {
        subscription,
        channels: [channel]
      };
    } else {
      this.feedSubscriptions[symbol].channels.push(channel);
    }

    const unsubscribe = () => {
      this.feedSubscriptions[symbol].channels = R.reject(R.equals(channel), this.feedSubscriptions[symbol].channels);
      this.sendActionToOrderBookWorker(closeChannelAction(channel));

      if (this.feedSubscriptions[symbol].channels.length === 0) {
        this.feedSubscriptions[symbol].subscription.unsubscribe();
        delete this.feedSubscriptions[symbol];
        this.sendActionToOrderBookWorker(unsubscribeAction(symbol));
      }

      if (Object.keys(this.feedSubscriptions).length === 0) {
        this.stopWorker();
      }
    };

    return this.workerStream.pipe(fromChannelAction(channel), finalize(unsubscribe));
  }

  sendActionToOrderBookWorker(channel, action) {
    const channelAction = typeof channel === 'string' ? createChanelAction(channel, action) : createChanelAction(orderBookChannel, channel);
    this.webWorker.postMessage(cloneDeepWith(channelAction, serializer));
  }

  runWorker() {
    if (undefined !== this.webWorker) {
      return;
    }

    this.webWorker = typeof this.worker === 'function' ? this.worker() : new Worker(this.worker);
    this.workerStream = workerStream$(this.webWorker);
  }

  stopWorker() {
    if (this.webWorker === undefined) {
      return;
    }

    this.webWorker.terminate();
    this.webWorker = undefined;
    this.workerStream = undefined;
  }

}

const dataHandledFor = spawnedSymbol => pipe(isCreator(dataHandledAction), filter(({
  payload: {
    symbol
  }
}) => symbol === spawnedSymbol));

var L2Action;

(function (L2Action) {
  L2Action["update"] = "update";
  L2Action["insert"] = "insert";
  L2Action["delete"] = "delete";
  L2Action["delete_from"] = "delete_from";
  L2Action["delete_thru"] = "delete_thru";
  L2Action["trade"] = "trade";
})(L2Action || (L2Action = {}));

var L2PackageType;

(function (L2PackageType) {
  L2PackageType["snapshot_full_refresh"] = "snapshot_full_refresh";
  L2PackageType["incremental_update"] = "incremental_update";
})(L2PackageType || (L2PackageType = {}));

var L2MessageSide;

(function (L2MessageSide) {
  L2MessageSide["buy"] = "buy";
  L2MessageSide["sell"] = "sell";
})(L2MessageSide || (L2MessageSide = {}));

const getAggregatedPriceRecordId = price => price.toFixed();

const getAggregatedQuantityRecordId = quantity => quantity.toFixed();

const getOrderId = (exchange, level) => `${exchange}${separator}${level}`;

const getAggregationPrice = (side, price, aggregationValue) => {
  const remainder = price.mod(aggregationValue);

  if (remainder.eq(0)) {
    return price;
  }

  const priceWithoutRemainder = price.sub(remainder);

  switch (side) {
    case L2MessageSide.sell:
      return priceWithoutRemainder.add(aggregationValue);

    case L2MessageSide.buy:
      return priceWithoutRemainder;
  }
};

const bindOnSelected = dispatch => ({
  onSelected: (price, quantity, exchange, side, type) => {
    dispatch(lineSelectedAction(price, quantity, exchange, side, type));
  }
});

var OrderType;

(function (OrderType) {
  OrderType["MARKET"] = "market";
  OrderType["STOP"] = "stop";
  OrderType["LIMIT"] = "limit";
})(OrderType || (OrderType = {}));

const calculateTradingAmountEpicType = 'calculateTradingAmountEpicType';

const min = (big1, big2) => big1.lt(big2) ? big1 : big2;

const getPrice = item => 'equalPriceRecord' in item ? item.equalPriceRecord.price : item.price;

const getAmount = (orders, quantity, type, price, side) => {
  const passive = [];
  const aggressive = [];
  let amount = new Big(0);

  if (type === OrderType.MARKET) {
    for (const item of orders) {
      if (amount.gte(quantity)) {
        break;
      }

      aggressive.push({
        amount: min(item.quantity, quantity.minus(amount)),
        price: getPrice(item)
      });
      amount = amount.add(item.quantity);
    }
  } else {
    for (const item of orders) {
      if (amount.gte(quantity) || (side === L2MessageSide.buy ? getPrice(item).gt(price) : getPrice(item).lt(price))) {
        break;
      }

      aggressive.push({
        amount: min(item.quantity, quantity.minus(amount)),
        price: getPrice(item)
      });
      amount = amount.add(item.quantity);
    }

    if (amount.lt(quantity)) {
      const t = quantity.minus(amount);
      passive.push({
        amount: t,
        price
      });
      amount = amount.add(t);
    }
  }

  return {
    aggressive,
    passive
  };
};

const serializeBig = value => value == null ? void 0 : value.toFixed();

const serialize = value => {
  if (value == null) {
    return void 0;
  }

  return value.map(i => ({
    amount: serializeBig(i.amount),
    price: serializeBig(i.price)
  }));
};

const calculateTradingAmountEpic = (action$, state$) => action$.pipe(isCreator(calculateTradingAmountAction), map(({
  payload: {
    amount: {
      id,
      quantity,
      type,
      symbol,
      exchange,
      price
    }
  }
}) => {
  quantity = new Big(quantity);
  price = price == null ? null : new Big(price);
  const allData = getOrderBookSubscription(state$.value, symbol);
  let buyPassive;
  let buyAggressive;
  let sellPassive;
  let sellAggressive;

  if (allData) {
    if (allData.buy) {
      const data = exchange ? allData.sell.orders[exchange] : allData.sell.aggregated.price.equal.records;
      const {
        aggressive,
        passive
      } = getAmount(data || [], quantity, type, price, L2MessageSide.buy);
      buyPassive = passive;
      buyAggressive = aggressive;
    }

    if (allData.sell) {
      const data = exchange ? allData.buy.orders[exchange] : allData.buy.aggregated.price.equal.records;
      const {
        aggressive,
        passive
      } = getAmount(data || [], quantity, type, price, L2MessageSide.sell);
      sellPassive = passive;
      sellAggressive = aggressive;
    }
  }

  return tradingAmountAction({
    id,
    buyPassive: serialize(buyPassive),
    buyAggressive: serialize(buyAggressive),
    sellAggressive: serialize(sellAggressive),
    sellPassive: serialize(sellPassive)
  });
}));

const entryToLevelRecord = (entry, exchange) => {
  var _a;

  let {
    quantity
  } = entry;

  if (quantity && quantity.lt(0)) {
    namespace('orderBook').warn('Received quantity lt 0', entry);
    quantity = new Big(0);
  }

  return {
    id: getOrderId(exchange, entry.level),
    quantity,
    exchange,
    level: entry.level,
    price: entry.price,
    action: entry.action,
    numberOfOrders: (_a = entry.number_of_orders) !== null && _a !== void 0 ? _a : 1
  };
};

const handleSnapshot = ({
  entries,
  security_id,
  exchange_id
}) => {
  if (!exchange_id) {
    // todo fixme
    if (entries.length === 0) {
      // wtf ?!, ok let's return empty result.
      namespace('orderBook').warn("L2Package does't have exchange_id.");
      return [];
    }

    exchange_id = entries[0].exchange_id;
  }

  const buyRecords = entries.filter(({
    side
  }) => side === L2MessageSide.buy).map(entry => entryToLevelRecord(entry, exchange_id));
  const sellRecords = entries.filter(({
    side
  }) => side === L2MessageSide.sell).map(entry => entryToLevelRecord(entry, exchange_id));
  return [snapshotAction(security_id, buyRecords, L2MessageSide.buy, exchange_id), snapshotAction(security_id, sellRecords, L2MessageSide.sell, exchange_id)];
};

const handleIncrementalUpdate = pack => {
  const {
    entries,
    security_id,
    timestamp
  } = pack;
  return entries.map(entry => {
    const {
      side,
      exchange_id: exchange
    } = entry;

    switch (entry.action) {
      case L2Action.insert:
        return insertOrderAction(security_id, entryToLevelRecord(entry, exchange), entry.price, side, exchange, entry.number_of_orders);

      case L2Action.update:
        return updateOrderAction(security_id, entryToLevelRecord(entry, exchange), entry.price, side, exchange, entry.number_of_orders);

      case L2Action.delete_from:
        return deleteOrderFromAction(security_id, entry.level, side, exchange);

      case L2Action.delete_thru:
        return deleteOrderThroughAction(security_id, entry.level, side, exchange);

      case L2Action.delete:
        return deleteOrderAction(security_id, entry.level, side, exchange);

      case L2Action.trade:
        return tradeAction(security_id, entry, timestamp, exchange);
    }
  });
};

const packageEpic = action$ => action$.pipe(isCreator(packageAction), map(({
  payload: {
    l2Package
  }
}) => {
  l2Package = unSerializeL2Package(l2Package);
  const actions = l2Package.type === L2PackageType.snapshot_full_refresh ? handleSnapshot(l2Package) : handleIncrementalUpdate(l2Package);
  return [...actions, aggregateByQuantityAction(l2Package.security_id), dataHandledAction(l2Package.security_id)];
}), concatAll());

const subscribeEpic = action$ => action$.pipe(isCreator(spawnChannelAction), map(({
  payload: {
    symbol,
    parameters,
    channel
  }
}) => subscribeAction(symbol, parameters, channel)));

const updateChannelParametersEpic = action$ => action$.pipe(isCreator(updateChannelParametersAction), map(action => [action, dataHandledAction(action.payload.symbol)]), concatAll());

const unsubscribeEpic = action$ => action$.pipe(isCreator(unsubscribeAction), map(action => action));

const closeChannelEpic = action$ => action$.pipe(isCreator(closeChannelAction), map(action => action));

const recordHoveredEpic = action$ => action$.pipe(isCreator(recordHoveredAction), map(action => action));

const noHoveredRecordsEpic = action$ => action$.pipe(isCreator(noHoveredRecordsAction), map(action => action));

const orderBookEpic = combineEpics(packageEpic, subscribeEpic, unsubscribeEpic, updateChannelParametersEpic, calculateTradingAmountEpic, closeChannelEpic, recordHoveredEpic, noHoveredRecordsEpic);

const createRootEpic = epicChannels => combineEpics(workerRouterEpic(epicChannels), (_, state$) => orderBookEpic(fromMainTread(orderBookChannel), state$, null));

function* aggregate(records, aggregationQuantity) {
  let aggregatedQuantity = Big(0);
  let aggregatedTotalPrice = Big(0);
  let iteration = 0;
  let recordIndex = 0;

  label: for (let {
    quantity,
    price
  } of records) {
    recordIndex++;

    while (true) {
      if (iteration > levelsOnScreen) {
        return;
      }

      const neededQuantity = aggregationQuantity.sub(aggregatedQuantity);
      const residualQuantity = quantity.sub(neededQuantity);

      if (residualQuantity.lte(0)) {
        aggregatedQuantity = aggregatedQuantity.add(quantity);
        aggregatedTotalPrice = aggregatedTotalPrice.add(quantity.mul(price));
        continue label;
      }

      aggregatedTotalPrice = aggregatedTotalPrice.add(neededQuantity.mul(price));
      aggregatedQuantity = Big(0);
      quantity = residualQuantity;
      iteration++;

      const _aggregatedQuantityRecordQuantity = aggregationQuantity.mul(iteration);

      if (neededQuantity.eq(0) && recordIndex > 1) {
        // no needed on current level (recordIndex - 1)
        price = records[recordIndex - 2].price;
      }

      yield {
        id: getAggregatedQuantityRecordId(_aggregatedQuantityRecordQuantity),
        quantity: _aggregatedQuantityRecordQuantity,
        price: aggregatedTotalPrice,
        worstPrice: price
      };
    }
  }

  const aggregatedQuantityRecordQuantity = aggregationQuantity.mul(iteration).add(aggregatedQuantity);
  const worstPrice = records.length > 0 ? records[records.length - 1].price : Big(0);
  yield {
    id: getAggregatedQuantityRecordId(aggregatedQuantityRecordQuantity),
    quantity: aggregatedQuantityRecordQuantity,
    price: aggregatedTotalPrice,
    worstPrice
  };
} // [!] mutate


const aggregateSide = (subscriptionSide, aggregationQuantity) => {
  const aggregatedByQuantity = subscriptionSide.aggregated[EAggregationTypes.quantity][aggregationQuantity];
  const prevAggregatedRecords = aggregatedByQuantity && aggregatedByQuantity.records || [];
  const aggregatedRecords = [];
  const generator = aggregate(subscriptionSide.aggregated[EAggregationTypes.price].equal.records, Big(aggregationQuantity));

  for (const aggregatedQuantityRecord of generator) {
    aggregatedRecords.push(aggregatedQuantityRecord);
  }

  const deleted = [];
  const prevAggregatedRecordsCount = prevAggregatedRecords.length;
  const aggregatedRecordsCount = aggregatedRecords.length;

  if (aggregatedRecordsCount < prevAggregatedRecordsCount) {
    const deletedAggregatedRecords = prevAggregatedRecords.slice(aggregatedRecordsCount);
    deletedAggregatedRecords.forEach(deletedAggregatedRecord => {
      deleted.push(getAggregatedQuantityRecordId(deletedAggregatedRecord.quantity));
    });
  }

  subscriptionSide.aggregated.quantity[aggregationQuantity] = {
    records: aggregatedRecords,
    deleted
  };
};

const aggregateByQuantityReducer = (state, action) => {
  const {
    payload: {
      symbol
    }
  } = action;
  const subscription = state.subscriptions[symbol];
  const quantityParameters = subscription.parameters.aggregation.quantity;
  quantityParameters.forEach(quantityParameter => {
    aggregateSide(subscription.sell, quantityParameter.value);
    aggregateSide(subscription.buy, quantityParameter.value);
  });
  return state;
};

/**
 * Run through all subscriptions and clear aggregated::[aggregation type]::deleted, aggregated::deleted
 */
// [!] mutate
const clearSide = subscriptionSide => {
  const {
    aggregated
  } = subscriptionSide;

  for (const aggregationType in aggregated) {
    if (aggregated.hasOwnProperty(aggregationType)) {
      for (const aggregatedBy in aggregated[aggregationType]) {
        if (aggregated[aggregationType].hasOwnProperty(aggregatedBy)) {
          aggregated[aggregationType][aggregatedBy].deleted = [];
        }
      }
    }
  }
};

const clearDeletedReducer = state => {
  for (const symbol in state.subscriptions) {
    if (state.subscriptions.hasOwnProperty(symbol)) {
      const subscription = state.subscriptions[symbol];
      clearSide(subscription.sell);
      clearSide(subscription.buy);
    }
  }

  return state;
};

/**
 * 1) Run through all subscriptions and remove channel from IParameter::channels
 * 2) Delete all IParameter with empty IParameter::channels
 * 2) Delete groups grouped by deleted IParameter
 */
// [!] mutate
const closeAggregationParameters = (subscription, channel) => {
  const aggregationParameters = subscription.parameters.aggregation;
  const aggregationTypes = Object.keys(aggregationParameters);
  aggregationTypes.forEach(aggregationType => {
    aggregationParameters[aggregationType] = aggregationParameters[aggregationType].filter(parameter => {
      parameter.channels = parameter.channels.filter(parameterChannel => parameterChannel !== channel);

      if (parameter.channels.length === 0) {
        delete subscription.buy.aggregated[aggregationType][parameter.value];
        delete subscription.sell.aggregated[aggregationType][parameter.value];
        return false;
      }

      return true;
    });
  });
};

const closeChannelReducer = (state, action) => {
  const {
    payload: {
      channel
    }
  } = action;

  for (const symbol in state.subscriptions) {
    if (state.subscriptions.hasOwnProperty(symbol)) {
      const subscription = state.subscriptions[symbol];
      closeAggregationParameters(subscription, channel);
    }
  }

  return state;
};

const bigBinarySearch = binarySearch((a, b) => a.price.cmp(b));
const recordSearchMap = {
  [L2MessageSide.buy]: bigBinarySearch('ASC'),
  [L2MessageSide.sell]: bigBinarySearch('DESC')
};

/**
 * 1) Calculate aggregatedPrice
 * 2) Find IAggregatedPriceRecord
 * 3) Remove IPriceRecord from IAggPriceRecord::records
 * 4) IF IAggregatedPriceRecord::records now empty:
 *      1) Push IAggPriceRecord::price to aggregated::deleted
 *      2) Remove IAggPriceRecord from aggregated::records
 *    ELSE
 *      Update IAggPriceRecord::quantity
 */
// [!] mutate

const deleteEqualPriceRecord = (subscriptionSide, side, equalPriceRecord, groupingPrice) => {
  const recordSearch = recordSearchMap[side];
  const aggregationPrice = getAggregationPrice(side, equalPriceRecord.price, groupingPrice);
  const aggregatedByPrice = subscriptionSide.aggregated[EAggregationTypes.price][groupingPrice];

  if (aggregatedByPrice) {
    const [aggregatedPriceRecordIndex, aggregatedPriceRecordFound] = recordSearch(aggregatedByPrice.records, aggregationPrice);

    if (aggregatedPriceRecordFound) {
      const aggregatedPriceRecord = aggregatedByPrice.records[aggregatedPriceRecordIndex];
      aggregatedPriceRecord.equalPriceRecords = aggregatedPriceRecord.equalPriceRecords.filter(p => p !== equalPriceRecord);

      if (aggregatedPriceRecord.equalPriceRecords.length === 0) {
        aggregatedByPrice.deleted.push(getAggregatedPriceRecordId(aggregatedPriceRecord.price));
        aggregatedByPrice.records.splice(aggregatedPriceRecordIndex, 1);
      } else {
        aggregatedPriceRecord.quantity = aggregatedPriceRecord.quantity.sub(equalPriceRecord.quantity);
      }
    } else {
      namespace('orderBook').error('no aggregatedPriceRecord to delete equalPriceRecord in');
    }
  }
};

/**
 * 1) Calculate aggregationPrice
 * 2) Find IAggPriceRecord
 * 3) Update IAggPriceRecord quantity
 */
// [!] mutate

const updateEqualPriceRecord = (subscriptionSide, side, equalPriceRecord, newQuantity, groupingPrice) => {
  const recordSearch = recordSearchMap[side];
  const aggregationPrice = getAggregationPrice(side, equalPriceRecord.price, groupingPrice);
  const aggregatedByPrice = subscriptionSide.aggregated[EAggregationTypes.price][groupingPrice];

  if (aggregatedByPrice) {
    const [aggregatedPriceRecordIndex, aggregatedPriceRecordFound] = recordSearch(aggregatedByPrice.records, aggregationPrice);

    if (aggregatedPriceRecordFound) {
      const aggregatedPriceRecord = aggregatedByPrice.records[aggregatedPriceRecordIndex];
      aggregatedPriceRecord.quantity = aggregatedPriceRecord.quantity.sub(equalPriceRecord.quantity).add(newQuantity);
    } else {
      namespace('orderBook').error('no aggregatedPriceRecord to update equalPriceRecord in');
    }
  }
};

const logOrder = order => `(P: ${order.price ? order.price.toString() : "-"} Q: ${order.quantity.toString()} L: ${order.level})`;
const logEqualPriceRecord = (equalPriceRecord, orders) => // tslint:disable-next-line:max-line-length
`Price record: P: ${equalPriceRecord.price.toString()} Q: ${equalPriceRecord.quantity.toString()}. Levels: ${orders.map(logOrder).join(", ")}`;

/**
 * 1) Get by level in IOrderBookSide::levels::["code"]
 *
 * 2) Get IPriceRecord by ref
 *  IF IPriceRecord contains only one level (current) remove IPriceRecord,
 *  ELSE remove current ILevelRecord from IPriceRecord::levels and update IPriceRecord::price
 */
// [!] mutate

const deleteOrderReducer = (state, side, parameters, action) => {
  const recordSearch = recordSearchMap[side];
  const {
    payload: {
      exchange,
      level
    }
  } = action;
  const oldOrder = state.orders[exchange][level];

  if (oldOrder === undefined) {
    namespace('orderBook').warn('[deleteOrderReducerLevelNotFound]', `Level ${level} for exchange ${exchange} not found.`);
    return state;
  }

  if (oldOrder.level !== level) {
    /* tslint:disable-next-line */
    namespace('orderBook').warn('[deleteOrderReducerMismatch]', `Look like bug in deleteLevelReducer. Level mismatch. Expected level: ${level} actual level ${oldOrder.level}`);
    return state;
  }

  state.orders[exchange].splice(level, 1);
  const last = state.orders[exchange].length;

  for (let i = level; i < last; i++) {
    const currentOrder = state.orders[exchange][i];
    currentOrder.level--;
    currentOrder.id = getOrderId(currentOrder.exchange, currentOrder.level);
  }

  const {
    equalPriceRecord
  } = oldOrder;
  const orders = equalPriceRecord.orders.filter(order => order !== oldOrder);
  equalPriceRecord.orders = orders;

  if (orders.length === 0) {
    const [equalPriceRecordIndex, equalPriceRecordFound] = recordSearch(state.aggregated[EAggregationTypes.price].equal.records, equalPriceRecord.price);

    if (!equalPriceRecordFound) {
      /* tslint:disable-next-line */
      namespace('orderBook').warn('[deleteLevelReducerPriceNotFound]', `Price ${equalPriceRecord.price.toString()} for exchange ${exchange} not found.`);
      return state;
    }

    parameters.aggregation[EAggregationTypes.price].forEach(groupingPrice => deleteEqualPriceRecord(state, side, equalPriceRecord, groupingPrice.value));
    state.aggregated[EAggregationTypes.price].equal.records.splice(equalPriceRecordIndex, 1);
    state.aggregated[EAggregationTypes.price].equal.deleted.push(getOrderId(exchange, level));
    return state;
  }

  const newPriceRecordQuantity = equalPriceRecord.quantity.sub(oldOrder.quantity);
  parameters.aggregation[EAggregationTypes.price].forEach(groupingPrice => updateEqualPriceRecord(state, side, equalPriceRecord, newPriceRecordQuantity, groupingPrice.value));
  equalPriceRecord.quantity = newPriceRecordQuantity;
  const ordersWithSameExchange = orders.filter(order => order.exchange === exchange);

  if (ordersWithSameExchange.length !== 0) {
    /* tslint:disable-next-line */
    namespace('orderBook').warn('[deleteOrderReducerSameLevels]', `Same levels in exchange ${exchange}. ${logEqualPriceRecord(equalPriceRecord, ordersWithSameExchange)}`);
  }

  return state;
};

/**
 * Delete all ILevelRecords from level 'x' to maximum level
 *
 * EXAMPLE: book(sell 4 levels): [45, 47, 48, 79, 100] deleteFrom(1) -> expected value [45]
 */
// [!] mutate

const deleteOrderFromReducer = (state, side, parameters, action) => {
  const {
    payload: {
      exchange,
      level,
      side: actionSide,
      symbol
    }
  } = action;
  const deleteCount = state.orders[exchange].length - level;
  return range(0, deleteCount, 1).reduce(nextState => deleteOrderReducer(nextState, side, parameters, deleteOrderAction(symbol, level, actionSide, exchange)), state);
};

/**
 * Delete all ILevelRecord from level 0 to level 'x'
 *
 * EXAMPLE: book(sell 4 levels): [45, 47, 48, 79, 100] deleteThru(3) -> expected value [100]
 */
// [!] mutate

const deleteOrderThroughReducer = (state, side, parameters, action) => {
  const {
    payload: {
      exchange,
      level,
      side: actionSide,
      symbol
    }
  } = action;
  return range(0, level + 1, 1).reduce(nextState => deleteOrderReducer(nextState, side, parameters, deleteOrderAction(symbol, 0, actionSide, exchange)), state);
};

const initExchange = (state, symbol, exchange) => {
  const subscription = state.subscriptions[symbol];
  const sellSide = subscription.sell;
  const buySide = subscription.buy;

  if (sellSide.orders[exchange] === undefined) {
    sellSide.orders[exchange] = [];
  }

  if (buySide.orders[exchange] === undefined) {
    buySide.orders[exchange] = [];
  }

  if (sellSide.snapshotHandled[exchange] === undefined) {
    sellSide.snapshotHandled[exchange] = false;
  }

  if (buySide.snapshotHandled[exchange] === undefined) {
    buySide.snapshotHandled[exchange] = false;
  }
};
/**
 * Return true when action not snapshot and levels is empty.
 */


const isInvalidUpdate = (state, action) => {
  const {
    payload: {
      exchange,
      symbol,
      side
    }
  } = action;

  if (action.type !== '@ORDER_BOOK/SNAPSHOT') {
    return !state.subscriptions[symbol][side].snapshotHandled[exchange];
  }

  return false;
};

const HOCReducer = reducer => (state, action) => {
  const {
    payload: {
      side,
      symbol,
      exchange
    }
  } = action;
  initExchange(state, symbol, exchange);

  if (isInvalidUpdate(state, action)) {
    namespace('orderBook').warn('[updateBeforeSnapshot]', 'Received update before snapshot.');
    return state;
  }

  const subscription = state.subscriptions[symbol];
  const subscriptionParameters = subscription.parameters;
  const subscriptionSide = subscription[side];
  const newSubscriptionSide = reducer(subscriptionSide, side, subscriptionParameters, action);
  return Object.assign(Object.assign({}, state), {
    subscriptions: Object.assign(Object.assign({}, state.subscriptions), {
      [symbol]: Object.assign(Object.assign({}, state.subscriptions[symbol]), {
        [side]: newSubscriptionSide
      })
    })
  });
};

const checkSameOrders = (equalPriceRecord, order) => {
  const sameOrders = equalPriceRecord.orders.filter(o => o.exchange === order.exchange);

  if (sameOrders.length !== 0) {
    namespace('orderBook').info('[insertOrderReducerSameLevels]', `Same levels in exchange ${order.exchange}. ${logEqualPriceRecord(equalPriceRecord, sameOrders)}. New insert: ${logOrder(order)}`);
  }
};

const getEqualPriceRecordId = price => price.toFixed();

const getSuitableOrderIndex = (orders, orderLevel) => {
  let iteration = 0;

  for (const order of orders) {
    if (order.level >= orderLevel) {
      return iteration;
    } else {
      iteration++;
    }
  }

  return iteration;
};

// [!] mutate
const insert = (list = [], value, index) => {
  // [!] mutate
  list.splice(index, 0, value);
};

const getSuitableEqualPriceRecordIndex = (equalPriceRecords, equalPriceRecordPrice) => {
  let iteration = 0;

  for (const equalPriceRecord of equalPriceRecords) {
    if (equalPriceRecord.price.gte(equalPriceRecordPrice)) {
      return iteration;
    } else {
      iteration++;
    }
  }

  return iteration;
};

/**
 * 1) Calculate aggregationPrice
 * 2) IF not aggregating by aggregation value:
 *      initialize
 * 3) Remove aggregationPrice from aggregated::deleted
 * 4) Find IAggPriceRecord
 * 5) IF found
 *      1) Update IAggPriceRecord quantity
 *      2) Push IPriceRecord to IAggPriceRecord::equalPriceRecords
 *    ELSE
 *      1) Create IAggPriceRecord
 *      2) Insert IAggPriceRecord to aggregated::records
 */
// [!] mutate

const insertEqualPriceRecord = (subscriptionSide, side, equalPriceRecord, aggregationValue) => {
  const recordSearch = recordSearchMap[side];
  const aggregationPrice = getAggregationPrice(side, equalPriceRecord.price, aggregationValue);

  if (subscriptionSide.aggregated[EAggregationTypes.price][aggregationValue] === undefined) {
    subscriptionSide.aggregated[EAggregationTypes.price][aggregationValue] = {
      records: [],
      deleted: []
    };
  }

  const aggregatedByPrice = subscriptionSide.aggregated[EAggregationTypes.price][aggregationValue];
  const aggregatedPriceRecordId = getAggregatedPriceRecordId(aggregationPrice);
  aggregatedByPrice.deleted = aggregatedByPrice.deleted.filter(deletedAggregatedPriceRecordId => deletedAggregatedPriceRecordId !== aggregatedPriceRecordId);
  const [aggregatedPriceRecordIndex, aggregatedPriceRecordFound] = recordSearch(aggregatedByPrice.records, aggregationPrice);

  if (aggregatedPriceRecordFound) {
    const aggregatedPriceRecord = aggregatedByPrice.records[aggregatedPriceRecordIndex];
    aggregatedPriceRecord.quantity = aggregatedPriceRecord.quantity.add(equalPriceRecord.quantity);
    const suitableEqualPriceRecordIndex = getSuitableEqualPriceRecordIndex(aggregatedPriceRecord.equalPriceRecords, equalPriceRecord.price);
    insert(aggregatedPriceRecord.equalPriceRecords, equalPriceRecord, suitableEqualPriceRecordIndex);
  } else {
    const newAggregatedPriceRecord = {
      id: getAggregatedPriceRecordId(aggregationPrice),
      quantity: equalPriceRecord.quantity,
      price: aggregationPrice,
      equalPriceRecords: [equalPriceRecord],
      numberOfOrders: equalPriceRecord.numberOfOrders
    };
    insert(aggregatedByPrice.records, newAggregatedPriceRecord, aggregatedPriceRecordIndex);
  }
};

/**
 * 1) Find IPriceRecord in IOrderBookSide::aggregated
 *    IF found
 *      1) Update IPriceRecord::quantity
 *      2) Push ILevelRecord to IPriceRecord::levels
 *      2) Link ILevelRecord::equalPriceRecord to IPriceRecord
 *    ELSE
 *      1) Create new IPriceRecord
 *      2) Insert IPriceRecord to IOrderBookSide::aggregated
 * 2) Insert ILevelRecord to IOrderBookSide::levels::[symbol] according ILevelRecord::level
 */
// [!] mutate

const insertOrderReducer = (state, side, parameters, action) => {
  const recordSearch = recordSearchMap[side];
  const {
    payload: {
      order
    }
  } = action;

  if (order.level < 0) {
    namespace('orderBook').error('Received order lt 0', order);
  }

  const {
    price
  } = order;
  const [equalPriceRecordIndex, equalPriceRecordFound] = recordSearch(state.aggregated[EAggregationTypes.price].equal.records, price);

  if (equalPriceRecordFound) {
    const equalPriceRecord = state.aggregated[EAggregationTypes.price].equal.records[equalPriceRecordIndex];
    checkSameOrders(equalPriceRecord, order);
    const suitableOrderIndex = getSuitableOrderIndex(equalPriceRecord.orders, order.level);
    insert(equalPriceRecord.orders, order, suitableOrderIndex);
    order.equalPriceRecord = equalPriceRecord;
    const newPriceRecordQuantity = equalPriceRecord.quantity.add(order.quantity);
    parameters.aggregation[EAggregationTypes.price].forEach(priceParameter => updateEqualPriceRecord(state, side, equalPriceRecord, newPriceRecordQuantity, priceParameter.value));
    equalPriceRecord.quantity = newPriceRecordQuantity;
  } else {
    const newPriceRecord = {
      id: getEqualPriceRecordId(price),
      quantity: order.quantity,
      price,
      orders: [order],
      numberOfOrders: order.numberOfOrders
    };
    parameters.aggregation.price.forEach(priceParameter => insertEqualPriceRecord(state, side, newPriceRecord, priceParameter.value));
    order.equalPriceRecord = newPriceRecord;
    state.aggregated[EAggregationTypes.price].equal.deleted = state.aggregated[EAggregationTypes.price].equal.deleted.filter(deleted => deleted !== getOrderId(order.exchange, order.level));
    insert(state.aggregated[EAggregationTypes.price].equal.records, newPriceRecord, equalPriceRecordIndex);
  }

  insert(state.orders[order.exchange], order, order.level);
  const orders = state.orders[order.exchange];

  for (let i = order.level + 1; i < orders.length; i++) {
    const currentOrder = orders[i]; // FIXME undefined.level ???

    if (currentOrder) {
      currentOrder.level++;
      currentOrder.id = getOrderId(currentOrder.exchange, currentOrder.level);
    }
  }

  delete order.price;
  return state;
};

/**
 * 1) Get old ILevelRecord from side::levels::[ILevelRecord::exchange][ILevelRecord::level]
 * 2) Get IPriceRecord from old ILevelRecord::equalPriceRecord
 * 3) Update IPriceRecord quantity
 * 4) Replace old ILevelRecord to new ILevelRecord in IPriceRecord::levels
 */
// [!] mutate

const updateOrderReducer = (state, side, parameters, action) => {
  const {
    payload: {
      order: newOrder
    }
  } = action;
  const oldOrder = state.orders[newOrder.exchange][newOrder.level];

  if (oldOrder === undefined) {
    /* tslint:disable-next-line */
    namespace('orderBook').warn('[updatOrderReducerNotFound]', `Level ${newOrder.level} for exchange ${newOrder.exchange} not found. Price: ${newOrder.price.toString()}, Qty: ${newOrder.quantity.toString()}`);
    return state;
  }

  if (!newOrder.price) {
    /* tslint:disable-next-line */
    namespace('orderBook').warn('[updateOrderReducerNoPrice]', `New level record doesn't contains price.`);
    return state;
  }

  if (!newOrder.price.eq(oldOrder.equalPriceRecord.price)) {
    /* tslint:disable-next-line */
    namespace('orderBook').warn('[updateOrderReducerPriceMismatch]', `Look like bug in update. Price mismatch for level: ${newOrder.level}. expected price: ${oldOrder.equalPriceRecord.price.toString()}, actual: ${newOrder.price.toString()}`);
    return state;
  }

  const {
    equalPriceRecord
  } = oldOrder;
  newOrder.equalPriceRecord = equalPriceRecord;
  state.orders[newOrder.exchange][newOrder.level] = newOrder;
  const newPriceRecordQuantity = equalPriceRecord.quantity.sub(oldOrder.quantity).add(newOrder.quantity);
  parameters.aggregation[EAggregationTypes.price].forEach(priceParameter => {
    updateEqualPriceRecord(state, side, equalPriceRecord, newPriceRecordQuantity, priceParameter.value);
  });
  equalPriceRecord.quantity = newPriceRecordQuantity;
  const index = equalPriceRecord.orders.indexOf(oldOrder);
  equalPriceRecord.orders[index] = newOrder;
  delete newOrder.price;
  return state;
};

const actionCreators = {
  [L2Action.delete]: (symbol, order, side, exchange) => deleteOrderAction(symbol, order.level, side, exchange),
  [L2Action.insert]: (symbol, order, side, exchange, numberOfOrders) => insertOrderAction(symbol, order, order.price, side, exchange, numberOfOrders),
  [L2Action.update]: (symbol, order, side, exchange, numberOfOrders) => updateOrderAction(symbol, order, order.price, side, exchange, numberOfOrders),
  [L2Action.delete_from]: (symbol, order, side, exchange) => deleteOrderFromAction(symbol, order.level, side, exchange),
  [L2Action.delete_thru]: (symbol, order, side, exchange) => deleteOrderAction(symbol, order.level, side, exchange)
};
const reducers = {
  [L2Action.delete]: deleteOrderReducer,
  [L2Action.insert]: insertOrderReducer,
  [L2Action.update]: updateOrderReducer,
  [L2Action.delete_from]: deleteOrderFromReducer,
  [L2Action.delete_thru]: deleteOrderThroughReducer
}; // [!] mutate

const snapshotReducer = (state, side, parameters, action) => {
  const {
    payload: {
      orders,
      side: actionSide,
      symbol,
      exchange
    }
  } = action;
  state.snapshotHandled[exchange] = true;
  state = range(0, state.orders[exchange].length, 1).reduce(nextState => reducers[L2Action.delete](nextState, side, parameters, deleteOrderAction(symbol, 0, actionSide, exchange)), state);

  if (state.orders[exchange].length !== 0) {
    namespace('orderBook').warn(`Fail to remove levels.`);
  }

  if (orders.length === 0) {
    // reset received
    state.snapshotHandled[exchange] = false;
    return state;
  }

  return orders.reduce((nextState, order, level) => {
    if (level !== order.level) {
      namespace('orderBook').warn(`Invalid snapshot. Level mismatch "${level}".`);
    }

    if (order.action === L2Action.update || order.action === L2Action.insert) {
      const suitableReducer = reducers[order.action];
      const suitableAction = actionCreators[order.action](symbol, order, actionSide, exchange, order.numberOfOrders);
      return suitableReducer(nextState, side, parameters, suitableAction);
    }

    return nextState;
  }, state);
};

const insertAggregationParameters = (aggregationParameters, channel, type, value) => {
  const existingParameterIndex = aggregationParameters[type].findIndex(parameter => parameter.value === value);

  if (existingParameterIndex >= 0) {
    const existingParameter = aggregationParameters[type][existingParameterIndex];
    existingParameter.channels = uniqueArray(existingParameter.channels, [channel]);
  } else if (value > 0) {
    const newParameter = {
      value,
      channels: [channel]
    };
    aggregationParameters[type].push(newParameter);
  }
};

const insertChannelParameters = (subscription, channel, parameters) => {
  if (parameters.aggregation) {
    const [type, value] = Object.entries(parameters.aggregation)[0];
    insertAggregationParameters(subscription.parameters.aggregation, channel, type, value);
  }
};

const subscribeReducer = (state, action) => {
  const {
    payload: {
      symbol,
      parameters,
      channel
    }
  } = action;

  if (state.subscriptions[symbol] === undefined) {
    state.subscriptions[symbol] = {
      parameters: {
        aggregation: {
          [EAggregationTypes.price]: [],
          [EAggregationTypes.quantity]: []
        }
      },
      buy: {
        snapshotHandled: {},
        aggregated: {
          [EAggregationTypes.price]: {
            equal: {
              records: [],
              deleted: []
            }
          },
          [EAggregationTypes.quantity]: {}
        },
        orders: {}
      },
      sell: {
        snapshotHandled: {},
        aggregated: {
          [EAggregationTypes.price]: {
            equal: {
              records: [],
              deleted: []
            }
          },
          [EAggregationTypes.quantity]: {}
        },
        orders: {}
      }
    };
  }

  insertChannelParameters(state.subscriptions[symbol], channel, parameters);
  return state;
};

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

/**
 * Remove subscriptions::symbol
 */

const unsubscribeReducer = (state, action) => {
  const {
    payload: {
      symbol
    }
  } = action;

  const _a = state.subscriptions,
        _b = symbol;
        _a[_b];
        const subscriptions = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);

  return Object.assign(Object.assign({}, state), {
    subscriptions
  });
};

const updateSide = (subscription, aggregationPrice, side) => {
  subscription[side].aggregated[EAggregationTypes.price].equal.records.forEach(equalPriceRecord => {
    insertEqualPriceRecord(subscription[side], side, equalPriceRecord, aggregationPrice);
  });
};

const updateChannelParametersReducer = (state, action) => {
  const {
    payload: {
      channel,
      parameters,
      symbol
    }
  } = action;
  const subscription = state.subscriptions[symbol];

  if (!subscription) {
    return state;
  }

  state = closeChannelReducer(state, closeChannelAction(channel));
  insertChannelParameters(state.subscriptions[symbol], channel, parameters);

  if (parameters.aggregation) {
    if (parameters.aggregation[EAggregationTypes.price]) {
      subscription.parameters.aggregation[EAggregationTypes.price].forEach(priceParameter => {
        updateSide(subscription, priceParameter.value, L2MessageSide.buy);
        updateSide(subscription, priceParameter.value, L2MessageSide.sell);
      });
    } else if (parameters.aggregation[EAggregationTypes.quantity]) {
      state = aggregateByQuantityReducer(state, aggregateByQuantityAction(symbol));
    }
  }

  return state;
};

const ordersSorted = orders => {
  for (let i = 1; i < orders.length; i++) {
    if (orders[i - 1].level >= orders[i].level) {
      return false;
    }
  }

  return true;
}; // buy:DESC, sell:ASK


const equalPriceRecordsSorted = (side, equalPriceRecords) => {
  for (let i = 1; i < equalPriceRecords.length; i++) {
    const prev = equalPriceRecords[i - 1].price;
    const current = equalPriceRecords[i].price;

    if (side === L2MessageSide.sell && prev.gt(current)) {
      return false;
    }

    if (side === L2MessageSide.buy && prev.lt(current)) {
      return false;
    }
  }

  return true;
};

const checkTooMuchLevelsWithSamePrice = (state, action) => {
  const {
    payload: {
      symbol,
      side,
      exchange
    }
  } = action;
  const mapByPrice = state.subscriptions[symbol][side].orders[exchange].reduce((map, record) => {
    const price = record.equalPriceRecord.price.toString();

    if (map[price] === undefined) {
      map[price] = [];
    }

    map[price].push(record);
    return map;
  }, {});
  Object.entries(mapByPrice).forEach(([price, orders]) => {
    if (orders.length > 3) {
      namespace('orderBook').warn('[SamePrice]', `Book contains too much (${orders.length}) orders with same price (${price}).`);
    }
  });
};

const validatedReducer = wrapped => (state, action) => {
  const {
    payload: {
      symbol,
      side
    }
  } = action;
  const sourceAction = JSON.stringify(action);
  const nextState = wrapped(state, action);
  const everySorted = Object.values(nextState.subscriptions[symbol][side].orders).map(ordersSorted).every(v => v);
  const priceSorted = equalPriceRecordsSorted(side, nextState.subscriptions[symbol][side].aggregated.price.equal.records);

  if (!everySorted || !priceSorted) {
    namespace('orderBook').error('[validatedReducer]', sourceAction, `Book is broken prices not sorted.`);
  }

  checkTooMuchLevelsWithSamePrice(nextState, action);
  return nextState;
};

const orderBookReducer = createRootReducer([[validatedReducer(HOCReducer(insertOrderReducer)), insertOrderAction], [validatedReducer(HOCReducer(updateOrderReducer)), updateOrderAction], [validatedReducer(HOCReducer(deleteOrderReducer)), deleteOrderAction], [validatedReducer(HOCReducer(deleteOrderThroughReducer)), deleteOrderThroughAction], [validatedReducer(HOCReducer(deleteOrderFromReducer)), deleteOrderFromAction], [validatedReducer(HOCReducer(snapshotReducer)), snapshotAction], [subscribeReducer, subscribeAction], [clearDeletedReducer, clearDeletedAction], [unsubscribeReducer, unsubscribeAction], [closeChannelReducer, closeChannelAction], [updateChannelParametersReducer, updateChannelParametersAction], [aggregateByQuantityReducer, aggregateByQuantityAction]], {
  subscriptions: {}
});
const orderBookSimpleReducer = createRootReducer([[HOCReducer(insertOrderReducer), insertOrderAction], [HOCReducer(updateOrderReducer), updateOrderAction], [HOCReducer(deleteOrderReducer), deleteOrderAction], [HOCReducer(deleteOrderThroughReducer), deleteOrderThroughAction], [HOCReducer(deleteOrderFromReducer), deleteOrderFromAction], [HOCReducer(snapshotReducer), snapshotAction], [subscribeReducer, subscribeAction], [clearDeletedReducer, clearDeletedAction], [unsubscribeReducer, unsubscribeAction], [closeChannelReducer, closeChannelAction], [updateChannelParametersReducer, updateChannelParametersAction], [aggregateByQuantityReducer, aggregateByQuantityAction]], {
  subscriptions: {}
});

const createComposeEnhancers = () => typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
  maxAge: 10000,
  actionsBlacklist: ['PACKAGE']
}) : compose;

const stateInActionMiddleware = ({
  getState
}) => next => action => {
  if (typeof action === 'function' && action.length === 1) {
    return next(action(getState()));
  }

  return next(action);
};

const createOrderBookStore = epicChannels => {
  const rootEpic = createRootEpic(epicChannels);
  const epicMiddleware = createEpicMiddleware();
  const state = createStore((state, action) => debugMode() ? orderBookReducer(state, action) : orderBookSimpleReducer(state, action), createComposeEnhancers()(applyMiddleware(stateInActionMiddleware, epicMiddleware)));
  epicMiddleware.run(rootEpic);
  return state;
};

export { ELineType, L2Action, L2MessageSide, L2PackageType, OrderBook, OrderType, aggregateByQuantityAction, bindOnSelected, calculateTradingAmountAction, calculateTradingAmountEpic, calculateTradingAmountEpicType, clearDeletedAction, closeChannelAction, createChanelAction, createOrderBookStore, createRootEpic, dataHandledAction, dataHandledFor, deleteOrderAction, deleteOrderFromAction, deleteOrderThroughAction, fromChannelAction, getAggregatedPriceRecordId, getAggregatedQuantityRecordId, getAggregationPrice, getOrderBookSubscription, getOrderId, insertOrderAction, l2MessageSerialize, l2MessageUnSerialize, lineSelectedAction, noHoveredRecordsAction, orderBookChannel, packageAction, recordHoveredAction, serializeL2Package, serializer, snapshotAction, spawnChannelAction, spawnEpic, subscribeAction, tradeAction, tradingAmountAction, unSerializeL2Package, unsubscribeAction, updateChannelParametersAction, updateOrderAction, workerRouterEpic, workerStream$ };
