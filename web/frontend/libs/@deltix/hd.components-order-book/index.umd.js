(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('big.js'), require('lodash'), require('ramda'), require('rxjs/operators'), require('rxjs'), require('@deltix/hd.components-utils'), require('@deltix/hd.components-common'), require('redux'), require('redux-observable'), require('@deltix/logger')) :
  typeof define === 'function' && define.amd ? define(['exports', 'big.js', 'lodash', 'ramda', 'rxjs/operators', 'rxjs', '@deltix/hd.components-utils', '@deltix/hd.components-common', 'redux', 'redux-observable', '@deltix/logger'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.OrderBook = {}, global.Big, global.lodash, global.R, global.operators, global.rxjs, global.hd_componentsUtils, global.hd_componentsCommon, global.redux, global.reduxObservable, global.logger));
})(this, (function (exports, Big, lodash, R, operators, rxjs, hd_componentsUtils, hd_componentsCommon, redux, reduxObservable, logger) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
      Object.keys(e).forEach(function (k) {
        if (k !== 'default') {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function () { return e[k]; }
          });
        }
      });
    }
    n["default"] = e;
    return Object.freeze(n);
  }

  var Big__default = /*#__PURE__*/_interopDefaultLegacy(Big);
  var R__namespace = /*#__PURE__*/_interopNamespace(R);

  const LoggedOrderBookFeed = wrapped => ({
    subscribe(symbol, appId) {
      return wrapped.subscribe(symbol, appId).pipe(operators.startWith(null), operators.pairwise(), operators.mergeMap(([prev, next]) => {
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

  const fromChannelAction = c => rxjs.pipe(operators.filter(({
    channel
  }) => channel === c), operators.pluck("action"));

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
  exports.ELineType = void 0;

  (function (ELineType) {
    ELineType["quantity"] = "quantity";
    ELineType["price"] = "price";
    ELineType["exchange"] = "exchange";
    ELineType["worst_price"] = "worst_price";
  })(exports.ELineType || (exports.ELineType = {}));
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

  const workerStream$ = worker => rxjs.fromEvent(worker, "message").pipe(operators.pluck("data"));

  const fromMainTread = channel => workerStream$(self).pipe(fromChannelAction(channel));

  const closeChannel$ = channelForSpawn => workerStream$(self).pipe(fromChannelAction(orderBookChannel), hd_componentsUtils.isCreator(closeChannelAction), operators.filter(({
    payload: {
      channel: closeChannel
    }
  }) => closeChannel === channelForSpawn), operators.take(1));

  const orderBookActionTypesWithSymbolActions = [insertOrderAction, updateOrderAction, snapshotAction, deleteOrderAction, deleteOrderFromAction, deleteOrderThroughAction, tradeAction, unsubscribeAction, dataHandledAction, tradingAmountAction];
  const orderBookActionTypesWithSymbol = {};

  for (const type of orderBookActionTypesWithSymbolActions) {
    orderBookActionTypesWithSymbol[hd_componentsUtils.getType(type)] = 1;
  }

  const serializer$1 = value => {
    if (value instanceof Big__default["default"]) {
      return value.toFixed();
    }
  };

  const filterBySymbol = onlyForSymbol => rxjs.pipe(operators.filter(action => {
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
    let actionStream$ = rxjs.merge( // send to epic only actions with specified symbol
    action$.pipe(filterBySymbol(symbol)), fromMainTread(channelForSpawn));
    const dataSet = getOrderBookSubscription(state$.value, symbol); // emmit first action

    if (undefined !== dataSet) {
      // actionStream$ = merge(actionStream$, of(packageHandledAction(symbol, [])));
      actionStream$ = rxjs.merge(actionStream$);
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
    }).pipe(operators.tap(action => {
      if (action.type in map) {
        self.postMessage(createChanelAction(channelForSpawn, lodash.cloneDeepWith(action, serializer$1)));
      }
    }), operators.takeUntil(closeChannel$(channelForSpawn)));
  };

  const createChanelAction = (channel, action) => ({
    channel,
    action
  });

  const getWorkerChannelByType = (epicType, channels) => channels.find(c => c.epicType === epicType);

  const workerRouterEpic = epicChannels => (action$, state$) => workerStream$(self).pipe(fromChannelAction(orderBookChannel), hd_componentsUtils.isCreator(spawnChannelAction), operators.mergeMap(({
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
    price: message.price ? new Big__default["default"](message.price) : message.price,
    quantity: message.quantity ? new Big__default["default"](message.quantity) : message.quantity
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
    if (value instanceof Big__default["default"]) {
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
        this.feedSubscriptions[symbol].channels = R__namespace.reject(R__namespace.equals(channel), this.feedSubscriptions[symbol].channels);
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

      return this.workerStream.pipe(fromChannelAction(channel), operators.finalize(unsubscribe));
    }

    sendActionToOrderBookWorker(channel, action) {
      const channelAction = typeof channel === 'string' ? createChanelAction(channel, action) : createChanelAction(orderBookChannel, channel);
      this.webWorker.postMessage(lodash.cloneDeepWith(channelAction, serializer));
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

  const dataHandledFor = spawnedSymbol => rxjs.pipe(hd_componentsUtils.isCreator(dataHandledAction), operators.filter(({
    payload: {
      symbol
    }
  }) => symbol === spawnedSymbol));

  exports.L2Action = void 0;

  (function (L2Action) {
    L2Action["update"] = "update";
    L2Action["insert"] = "insert";
    L2Action["delete"] = "delete";
    L2Action["delete_from"] = "delete_from";
    L2Action["delete_thru"] = "delete_thru";
    L2Action["trade"] = "trade";
  })(exports.L2Action || (exports.L2Action = {}));

  exports.L2PackageType = void 0;

  (function (L2PackageType) {
    L2PackageType["snapshot_full_refresh"] = "snapshot_full_refresh";
    L2PackageType["incremental_update"] = "incremental_update";
  })(exports.L2PackageType || (exports.L2PackageType = {}));

  exports.L2MessageSide = void 0;

  (function (L2MessageSide) {
    L2MessageSide["buy"] = "buy";
    L2MessageSide["sell"] = "sell";
  })(exports.L2MessageSide || (exports.L2MessageSide = {}));

  const getAggregatedPriceRecordId = price => price.toFixed();

  const getAggregatedQuantityRecordId = quantity => quantity.toFixed();

  const getOrderId = (exchange, level) => `${exchange}${hd_componentsCommon.separator}${level}`;

  const getAggregationPrice = (side, price, aggregationValue) => {
    const remainder = price.mod(aggregationValue);

    if (remainder.eq(0)) {
      return price;
    }

    const priceWithoutRemainder = price.sub(remainder);

    switch (side) {
      case exports.L2MessageSide.sell:
        return priceWithoutRemainder.add(aggregationValue);

      case exports.L2MessageSide.buy:
        return priceWithoutRemainder;
    }
  };

  const bindOnSelected = dispatch => ({
    onSelected: (price, quantity, exchange, side, type) => {
      dispatch(lineSelectedAction(price, quantity, exchange, side, type));
    }
  });

  exports.OrderType = void 0;

  (function (OrderType) {
    OrderType["MARKET"] = "market";
    OrderType["STOP"] = "stop";
    OrderType["LIMIT"] = "limit";
  })(exports.OrderType || (exports.OrderType = {}));

  const calculateTradingAmountEpicType = 'calculateTradingAmountEpicType';

  const min = (big1, big2) => big1.lt(big2) ? big1 : big2;

  const getPrice = item => 'equalPriceRecord' in item ? item.equalPriceRecord.price : item.price;

  const getAmount = (orders, quantity, type, price, side) => {
    const passive = [];
    const aggressive = [];
    let amount = new Big__default["default"](0);

    if (type === exports.OrderType.MARKET) {
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
        if (amount.gte(quantity) || (side === exports.L2MessageSide.buy ? getPrice(item).gt(price) : getPrice(item).lt(price))) {
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

  const calculateTradingAmountEpic = (action$, state$) => action$.pipe(hd_componentsUtils.isCreator(calculateTradingAmountAction), operators.map(({
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
    quantity = new Big__default["default"](quantity);
    price = price == null ? null : new Big__default["default"](price);
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
        } = getAmount(data || [], quantity, type, price, exports.L2MessageSide.buy);
        buyPassive = passive;
        buyAggressive = aggressive;
      }

      if (allData.sell) {
        const data = exchange ? allData.buy.orders[exchange] : allData.buy.aggregated.price.equal.records;
        const {
          aggressive,
          passive
        } = getAmount(data || [], quantity, type, price, exports.L2MessageSide.sell);
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
      logger.namespace('orderBook').warn('Received quantity lt 0', entry);
      quantity = new Big__default["default"](0);
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
        logger.namespace('orderBook').warn("L2Package does't have exchange_id.");
        return [];
      }

      exchange_id = entries[0].exchange_id;
    }

    const buyRecords = entries.filter(({
      side
    }) => side === exports.L2MessageSide.buy).map(entry => entryToLevelRecord(entry, exchange_id));
    const sellRecords = entries.filter(({
      side
    }) => side === exports.L2MessageSide.sell).map(entry => entryToLevelRecord(entry, exchange_id));
    return [snapshotAction(security_id, buyRecords, exports.L2MessageSide.buy, exchange_id), snapshotAction(security_id, sellRecords, exports.L2MessageSide.sell, exchange_id)];
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
        case exports.L2Action.insert:
          return insertOrderAction(security_id, entryToLevelRecord(entry, exchange), entry.price, side, exchange, entry.number_of_orders);

        case exports.L2Action.update:
          return updateOrderAction(security_id, entryToLevelRecord(entry, exchange), entry.price, side, exchange, entry.number_of_orders);

        case exports.L2Action.delete_from:
          return deleteOrderFromAction(security_id, entry.level, side, exchange);

        case exports.L2Action.delete_thru:
          return deleteOrderThroughAction(security_id, entry.level, side, exchange);

        case exports.L2Action.delete:
          return deleteOrderAction(security_id, entry.level, side, exchange);

        case exports.L2Action.trade:
          return tradeAction(security_id, entry, timestamp, exchange);
      }
    });
  };

  const packageEpic = action$ => action$.pipe(hd_componentsUtils.isCreator(packageAction), operators.map(({
    payload: {
      l2Package
    }
  }) => {
    l2Package = unSerializeL2Package(l2Package);
    const actions = l2Package.type === exports.L2PackageType.snapshot_full_refresh ? handleSnapshot(l2Package) : handleIncrementalUpdate(l2Package);
    return [...actions, aggregateByQuantityAction(l2Package.security_id), dataHandledAction(l2Package.security_id)];
  }), operators.concatAll());

  const subscribeEpic = action$ => action$.pipe(hd_componentsUtils.isCreator(spawnChannelAction), operators.map(({
    payload: {
      symbol,
      parameters,
      channel
    }
  }) => subscribeAction(symbol, parameters, channel)));

  const updateChannelParametersEpic = action$ => action$.pipe(hd_componentsUtils.isCreator(updateChannelParametersAction), operators.map(action => [action, dataHandledAction(action.payload.symbol)]), operators.concatAll());

  const unsubscribeEpic = action$ => action$.pipe(hd_componentsUtils.isCreator(unsubscribeAction), operators.map(action => action));

  const closeChannelEpic = action$ => action$.pipe(hd_componentsUtils.isCreator(closeChannelAction), operators.map(action => action));

  const recordHoveredEpic = action$ => action$.pipe(hd_componentsUtils.isCreator(recordHoveredAction), operators.map(action => action));

  const noHoveredRecordsEpic = action$ => action$.pipe(hd_componentsUtils.isCreator(noHoveredRecordsAction), operators.map(action => action));

  const orderBookEpic = reduxObservable.combineEpics(packageEpic, subscribeEpic, unsubscribeEpic, updateChannelParametersEpic, calculateTradingAmountEpic, closeChannelEpic, recordHoveredEpic, noHoveredRecordsEpic);

  const createRootEpic = epicChannels => reduxObservable.combineEpics(workerRouterEpic(epicChannels), (_, state$) => orderBookEpic(fromMainTread(orderBookChannel), state$, null));

  function* aggregate(records, aggregationQuantity) {
    let aggregatedQuantity = Big__default["default"](0);
    let aggregatedTotalPrice = Big__default["default"](0);
    let iteration = 0;
    let recordIndex = 0;

    label: for (let {
      quantity,
      price
    } of records) {
      recordIndex++;

      while (true) {
        if (iteration > hd_componentsCommon.levelsOnScreen) {
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
        aggregatedQuantity = Big__default["default"](0);
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
    const worstPrice = records.length > 0 ? records[records.length - 1].price : Big__default["default"](0);
    yield {
      id: getAggregatedQuantityRecordId(aggregatedQuantityRecordQuantity),
      quantity: aggregatedQuantityRecordQuantity,
      price: aggregatedTotalPrice,
      worstPrice
    };
  } // [!] mutate


  const aggregateSide = (subscriptionSide, aggregationQuantity) => {
    const aggregatedByQuantity = subscriptionSide.aggregated[hd_componentsCommon.EAggregationTypes.quantity][aggregationQuantity];
    const prevAggregatedRecords = aggregatedByQuantity && aggregatedByQuantity.records || [];
    const aggregatedRecords = [];
    const generator = aggregate(subscriptionSide.aggregated[hd_componentsCommon.EAggregationTypes.price].equal.records, Big__default["default"](aggregationQuantity));

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

  const bigBinarySearch = hd_componentsUtils.binarySearch((a, b) => a.price.cmp(b));
  const recordSearchMap = {
    [exports.L2MessageSide.buy]: bigBinarySearch('ASC'),
    [exports.L2MessageSide.sell]: bigBinarySearch('DESC')
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
    const aggregatedByPrice = subscriptionSide.aggregated[hd_componentsCommon.EAggregationTypes.price][groupingPrice];

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
        logger.namespace('orderBook').error('no aggregatedPriceRecord to delete equalPriceRecord in');
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
    const aggregatedByPrice = subscriptionSide.aggregated[hd_componentsCommon.EAggregationTypes.price][groupingPrice];

    if (aggregatedByPrice) {
      const [aggregatedPriceRecordIndex, aggregatedPriceRecordFound] = recordSearch(aggregatedByPrice.records, aggregationPrice);

      if (aggregatedPriceRecordFound) {
        const aggregatedPriceRecord = aggregatedByPrice.records[aggregatedPriceRecordIndex];
        aggregatedPriceRecord.quantity = aggregatedPriceRecord.quantity.sub(equalPriceRecord.quantity).add(newQuantity);
      } else {
        logger.namespace('orderBook').error('no aggregatedPriceRecord to update equalPriceRecord in');
      }
    }
  };

  const logOrder = order => `(P: ${order.price ? order.price.toString() : "-"} Q: ${order.quantity.toString()} L: ${order.level})`;
  const logEqualPriceRecord = (equalPriceRecord, orders) => // tslint:disable-next-line:max-line-length
`Price record: P: ${equalPriceRecord.price.toString()} Q: ${equalPriceRecord.quantity.toString()}. Levels: ${orders.map(logOrder).join(", ")}`  ;

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
      logger.namespace('orderBook').warn('[deleteOrderReducerLevelNotFound]', `Level ${level} for exchange ${exchange} not found.`);
      return state;
    }

    if (oldOrder.level !== level) {
      /* tslint:disable-next-line */
      logger.namespace('orderBook').warn('[deleteOrderReducerMismatch]', `Look like bug in deleteLevelReducer. Level mismatch. Expected level: ${level} actual level ${oldOrder.level}`);
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
      const [equalPriceRecordIndex, equalPriceRecordFound] = recordSearch(state.aggregated[hd_componentsCommon.EAggregationTypes.price].equal.records, equalPriceRecord.price);

      if (!equalPriceRecordFound) {
        /* tslint:disable-next-line */
        logger.namespace('orderBook').warn('[deleteLevelReducerPriceNotFound]', `Price ${equalPriceRecord.price.toString()} for exchange ${exchange} not found.`);
        return state;
      }

      parameters.aggregation[hd_componentsCommon.EAggregationTypes.price].forEach(groupingPrice => deleteEqualPriceRecord(state, side, equalPriceRecord, groupingPrice.value));
      state.aggregated[hd_componentsCommon.EAggregationTypes.price].equal.records.splice(equalPriceRecordIndex, 1);
      state.aggregated[hd_componentsCommon.EAggregationTypes.price].equal.deleted.push(getOrderId(exchange, level));
      return state;
    }

    const newPriceRecordQuantity = equalPriceRecord.quantity.sub(oldOrder.quantity);
    parameters.aggregation[hd_componentsCommon.EAggregationTypes.price].forEach(groupingPrice => updateEqualPriceRecord(state, side, equalPriceRecord, newPriceRecordQuantity, groupingPrice.value));
    equalPriceRecord.quantity = newPriceRecordQuantity;
    const ordersWithSameExchange = orders.filter(order => order.exchange === exchange);

    if (ordersWithSameExchange.length !== 0) {
      /* tslint:disable-next-line */
      logger.namespace('orderBook').warn('[deleteOrderReducerSameLevels]', `Same levels in exchange ${exchange}. ${logEqualPriceRecord(equalPriceRecord, ordersWithSameExchange)}`);
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
    return lodash.range(0, deleteCount, 1).reduce(nextState => deleteOrderReducer(nextState, side, parameters, deleteOrderAction(symbol, level, actionSide, exchange)), state);
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
    return lodash.range(0, level + 1, 1).reduce(nextState => deleteOrderReducer(nextState, side, parameters, deleteOrderAction(symbol, 0, actionSide, exchange)), state);
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
      logger.namespace('orderBook').warn('[updateBeforeSnapshot]', 'Received update before snapshot.');
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
      logger.namespace('orderBook').info('[insertOrderReducerSameLevels]', `Same levels in exchange ${order.exchange}. ${logEqualPriceRecord(equalPriceRecord, sameOrders)}. New insert: ${logOrder(order)}`);
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

    if (subscriptionSide.aggregated[hd_componentsCommon.EAggregationTypes.price][aggregationValue] === undefined) {
      subscriptionSide.aggregated[hd_componentsCommon.EAggregationTypes.price][aggregationValue] = {
        records: [],
        deleted: []
      };
    }

    const aggregatedByPrice = subscriptionSide.aggregated[hd_componentsCommon.EAggregationTypes.price][aggregationValue];
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
      logger.namespace('orderBook').error('Received order lt 0', order);
    }

    const {
      price
    } = order;
    const [equalPriceRecordIndex, equalPriceRecordFound] = recordSearch(state.aggregated[hd_componentsCommon.EAggregationTypes.price].equal.records, price);

    if (equalPriceRecordFound) {
      const equalPriceRecord = state.aggregated[hd_componentsCommon.EAggregationTypes.price].equal.records[equalPriceRecordIndex];
      checkSameOrders(equalPriceRecord, order);
      const suitableOrderIndex = getSuitableOrderIndex(equalPriceRecord.orders, order.level);
      insert(equalPriceRecord.orders, order, suitableOrderIndex);
      order.equalPriceRecord = equalPriceRecord;
      const newPriceRecordQuantity = equalPriceRecord.quantity.add(order.quantity);
      parameters.aggregation[hd_componentsCommon.EAggregationTypes.price].forEach(priceParameter => updateEqualPriceRecord(state, side, equalPriceRecord, newPriceRecordQuantity, priceParameter.value));
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
      state.aggregated[hd_componentsCommon.EAggregationTypes.price].equal.deleted = state.aggregated[hd_componentsCommon.EAggregationTypes.price].equal.deleted.filter(deleted => deleted !== getOrderId(order.exchange, order.level));
      insert(state.aggregated[hd_componentsCommon.EAggregationTypes.price].equal.records, newPriceRecord, equalPriceRecordIndex);
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
      logger.namespace('orderBook').warn('[updatOrderReducerNotFound]', `Level ${newOrder.level} for exchange ${newOrder.exchange} not found. Price: ${newOrder.price.toString()}, Qty: ${newOrder.quantity.toString()}`);
      return state;
    }

    if (!newOrder.price) {
      /* tslint:disable-next-line */
      logger.namespace('orderBook').warn('[updateOrderReducerNoPrice]', `New level record doesn't contains price.`);
      return state;
    }

    if (!newOrder.price.eq(oldOrder.equalPriceRecord.price)) {
      /* tslint:disable-next-line */
      logger.namespace('orderBook').warn('[updateOrderReducerPriceMismatch]', `Look like bug in update. Price mismatch for level: ${newOrder.level}. expected price: ${oldOrder.equalPriceRecord.price.toString()}, actual: ${newOrder.price.toString()}`);
      return state;
    }

    const {
      equalPriceRecord
    } = oldOrder;
    newOrder.equalPriceRecord = equalPriceRecord;
    state.orders[newOrder.exchange][newOrder.level] = newOrder;
    const newPriceRecordQuantity = equalPriceRecord.quantity.sub(oldOrder.quantity).add(newOrder.quantity);
    parameters.aggregation[hd_componentsCommon.EAggregationTypes.price].forEach(priceParameter => {
      updateEqualPriceRecord(state, side, equalPriceRecord, newPriceRecordQuantity, priceParameter.value);
    });
    equalPriceRecord.quantity = newPriceRecordQuantity;
    const index = equalPriceRecord.orders.indexOf(oldOrder);
    equalPriceRecord.orders[index] = newOrder;
    delete newOrder.price;
    return state;
  };

  const actionCreators = {
    [exports.L2Action.delete]: (symbol, order, side, exchange) => deleteOrderAction(symbol, order.level, side, exchange),
    [exports.L2Action.insert]: (symbol, order, side, exchange, numberOfOrders) => insertOrderAction(symbol, order, order.price, side, exchange, numberOfOrders),
    [exports.L2Action.update]: (symbol, order, side, exchange, numberOfOrders) => updateOrderAction(symbol, order, order.price, side, exchange, numberOfOrders),
    [exports.L2Action.delete_from]: (symbol, order, side, exchange) => deleteOrderFromAction(symbol, order.level, side, exchange),
    [exports.L2Action.delete_thru]: (symbol, order, side, exchange) => deleteOrderAction(symbol, order.level, side, exchange)
  };
  const reducers = {
    [exports.L2Action.delete]: deleteOrderReducer,
    [exports.L2Action.insert]: insertOrderReducer,
    [exports.L2Action.update]: updateOrderReducer,
    [exports.L2Action.delete_from]: deleteOrderFromReducer,
    [exports.L2Action.delete_thru]: deleteOrderThroughReducer
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
    state = lodash.range(0, state.orders[exchange].length, 1).reduce(nextState => reducers[exports.L2Action.delete](nextState, side, parameters, deleteOrderAction(symbol, 0, actionSide, exchange)), state);

    if (state.orders[exchange].length !== 0) {
      logger.namespace('orderBook').warn(`Fail to remove levels.`);
    }

    if (orders.length === 0) {
      // reset received
      state.snapshotHandled[exchange] = false;
      return state;
    }

    return orders.reduce((nextState, order, level) => {
      if (level !== order.level) {
        logger.namespace('orderBook').warn(`Invalid snapshot. Level mismatch "${level}".`);
      }

      if (order.action === exports.L2Action.update || order.action === exports.L2Action.insert) {
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
      existingParameter.channels = hd_componentsUtils.uniqueArray(existingParameter.channels, [channel]);
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
            [hd_componentsCommon.EAggregationTypes.price]: [],
            [hd_componentsCommon.EAggregationTypes.quantity]: []
          }
        },
        buy: {
          snapshotHandled: {},
          aggregated: {
            [hd_componentsCommon.EAggregationTypes.price]: {
              equal: {
                records: [],
                deleted: []
              }
            },
            [hd_componentsCommon.EAggregationTypes.quantity]: {}
          },
          orders: {}
        },
        sell: {
          snapshotHandled: {},
          aggregated: {
            [hd_componentsCommon.EAggregationTypes.price]: {
              equal: {
                records: [],
                deleted: []
              }
            },
            [hd_componentsCommon.EAggregationTypes.quantity]: {}
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
    subscription[side].aggregated[hd_componentsCommon.EAggregationTypes.price].equal.records.forEach(equalPriceRecord => {
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
      if (parameters.aggregation[hd_componentsCommon.EAggregationTypes.price]) {
        subscription.parameters.aggregation[hd_componentsCommon.EAggregationTypes.price].forEach(priceParameter => {
          updateSide(subscription, priceParameter.value, exports.L2MessageSide.buy);
          updateSide(subscription, priceParameter.value, exports.L2MessageSide.sell);
        });
      } else if (parameters.aggregation[hd_componentsCommon.EAggregationTypes.quantity]) {
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

      if (side === exports.L2MessageSide.sell && prev.gt(current)) {
        return false;
      }

      if (side === exports.L2MessageSide.buy && prev.lt(current)) {
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
        logger.namespace('orderBook').warn('[SamePrice]', `Book contains too much (${orders.length}) orders with same price (${price}).`);
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
      logger.namespace('orderBook').error('[validatedReducer]', sourceAction, `Book is broken prices not sorted.`);
    }

    checkTooMuchLevelsWithSamePrice(nextState, action);
    return nextState;
  };

  const orderBookReducer = hd_componentsUtils.createRootReducer([[validatedReducer(HOCReducer(insertOrderReducer)), insertOrderAction], [validatedReducer(HOCReducer(updateOrderReducer)), updateOrderAction], [validatedReducer(HOCReducer(deleteOrderReducer)), deleteOrderAction], [validatedReducer(HOCReducer(deleteOrderThroughReducer)), deleteOrderThroughAction], [validatedReducer(HOCReducer(deleteOrderFromReducer)), deleteOrderFromAction], [validatedReducer(HOCReducer(snapshotReducer)), snapshotAction], [subscribeReducer, subscribeAction], [clearDeletedReducer, clearDeletedAction], [unsubscribeReducer, unsubscribeAction], [closeChannelReducer, closeChannelAction], [updateChannelParametersReducer, updateChannelParametersAction], [aggregateByQuantityReducer, aggregateByQuantityAction]], {
    subscriptions: {}
  });
  const orderBookSimpleReducer = hd_componentsUtils.createRootReducer([[HOCReducer(insertOrderReducer), insertOrderAction], [HOCReducer(updateOrderReducer), updateOrderAction], [HOCReducer(deleteOrderReducer), deleteOrderAction], [HOCReducer(deleteOrderThroughReducer), deleteOrderThroughAction], [HOCReducer(deleteOrderFromReducer), deleteOrderFromAction], [HOCReducer(snapshotReducer), snapshotAction], [subscribeReducer, subscribeAction], [clearDeletedReducer, clearDeletedAction], [unsubscribeReducer, unsubscribeAction], [closeChannelReducer, closeChannelAction], [updateChannelParametersReducer, updateChannelParametersAction], [aggregateByQuantityReducer, aggregateByQuantityAction]], {
    subscriptions: {}
  });

  const createComposeEnhancers = () => typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
    maxAge: 10000,
    actionsBlacklist: ['PACKAGE']
  }) : redux.compose;

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
    const epicMiddleware = reduxObservable.createEpicMiddleware();
    const state = redux.createStore((state, action) => hd_componentsCommon.debugMode() ? orderBookReducer(state, action) : orderBookSimpleReducer(state, action), createComposeEnhancers()(redux.applyMiddleware(stateInActionMiddleware, epicMiddleware)));
    epicMiddleware.run(rootEpic);
    return state;
  };

  exports.OrderBook = OrderBook;
  exports.aggregateByQuantityAction = aggregateByQuantityAction;
  exports.bindOnSelected = bindOnSelected;
  exports.calculateTradingAmountAction = calculateTradingAmountAction;
  exports.calculateTradingAmountEpic = calculateTradingAmountEpic;
  exports.calculateTradingAmountEpicType = calculateTradingAmountEpicType;
  exports.clearDeletedAction = clearDeletedAction;
  exports.closeChannelAction = closeChannelAction;
  exports.createChanelAction = createChanelAction;
  exports.createOrderBookStore = createOrderBookStore;
  exports.createRootEpic = createRootEpic;
  exports.dataHandledAction = dataHandledAction;
  exports.dataHandledFor = dataHandledFor;
  exports.deleteOrderAction = deleteOrderAction;
  exports.deleteOrderFromAction = deleteOrderFromAction;
  exports.deleteOrderThroughAction = deleteOrderThroughAction;
  exports.fromChannelAction = fromChannelAction;
  exports.getAggregatedPriceRecordId = getAggregatedPriceRecordId;
  exports.getAggregatedQuantityRecordId = getAggregatedQuantityRecordId;
  exports.getAggregationPrice = getAggregationPrice;
  exports.getOrderBookSubscription = getOrderBookSubscription;
  exports.getOrderId = getOrderId;
  exports.insertOrderAction = insertOrderAction;
  exports.l2MessageSerialize = l2MessageSerialize;
  exports.l2MessageUnSerialize = l2MessageUnSerialize;
  exports.lineSelectedAction = lineSelectedAction;
  exports.noHoveredRecordsAction = noHoveredRecordsAction;
  exports.orderBookChannel = orderBookChannel;
  exports.packageAction = packageAction;
  exports.recordHoveredAction = recordHoveredAction;
  exports.serializeL2Package = serializeL2Package;
  exports.serializer = serializer;
  exports.snapshotAction = snapshotAction;
  exports.spawnChannelAction = spawnChannelAction;
  exports.spawnEpic = spawnEpic;
  exports.subscribeAction = subscribeAction;
  exports.tradeAction = tradeAction;
  exports.tradingAmountAction = tradingAmountAction;
  exports.unSerializeL2Package = unSerializeL2Package;
  exports.unsubscribeAction = unsubscribeAction;
  exports.updateChannelParametersAction = updateChannelParametersAction;
  exports.updateOrderAction = updateOrderAction;
  exports.workerRouterEpic = workerRouterEpic;
  exports.workerStream$ = workerStream$;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
