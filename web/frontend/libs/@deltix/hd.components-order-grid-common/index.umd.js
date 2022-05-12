(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('redux-observable'), require('@deltix/hd.components-order-book'), require('@deltix/hd.components-utils'), require('rxjs/operators'), require('@deltix/decimal-utils'), require('@deltix/hd.components-common')) :
  typeof define === 'function' && define.amd ? define(['exports', 'redux-observable', '@deltix/hd.components-order-book', '@deltix/hd.components-utils', 'rxjs/operators', '@deltix/decimal-utils', '@deltix/hd.components-common'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.OrderGridCommon = {}, global.reduxObservable, global.hd_componentsOrderBook, global.hd_componentsUtils, global.operators, global.decimalUtils, global.hd_componentsCommon));
})(this, (function (exports, reduxObservable, hd_componentsOrderBook, hd_componentsUtils, operators, decimalUtils, hd_componentsCommon) { 'use strict';

  const updateGridAction = (buy, sell, spread) => ({
    type: '@ORDER_GRID/UPDATE_GRID',
    payload: {
      buy,
      sell,
      spread
    }
  });
  /**
   * API
   */

  const updateUserOrdersAction = userOrders => {
    // updateUserOrdersValidator(userOrders);
    return {
      type: '@ORDER_GRID/UPDATE_USER_ORDERS',
      payload: {
        userOrders
      }
    };
  };
  /**
   * API
   */

  const updateParametersAction = parameters => {
    // gridUpdateParametersValidator(parameters);
    return {
      type: '@ORDER_GRID/UPDATE_PARAMETERS',
      payload: {
        parameters
      }
    };
  };
  const highlightOrderAction = (groupId, side, entity) => ({
    type: '@ORDER_GRID/HIGHLIGHT_ORDER_ACTION',
    payload: {
      groupId,
      side,
      entity
    }
  });
  const noOrderToHighlightAction = groupId => ({
    type: '@ORDER_GRID/NO_ORDER_TO_HIGHLIGHT_ACTION',
    payload: {
      groupId
    }
  });
  const orderHoveredAction = (side, entity) => ({
    type: '@ORDER_GRID/ORDER_HOVERED',
    payload: {
      side,
      entity
    }
  });

  const orderGridEpicType = 'orderGridEpicType';
  exports.L2MessageSide = void 0;

  (function (L2MessageSide) {
    L2MessageSide["buy"] = "buy";
    L2MessageSide["sell"] = "sell";
  })(exports.L2MessageSide || (exports.L2MessageSide = {}));

  const noHoveredRecordsEpic = action$ => action$.pipe(hd_componentsUtils.isCreator(hd_componentsOrderBook.noHoveredRecordsAction), operators.map(({
    payload: {
      groupId
    }
  }) => noOrderToHighlightAction(groupId)));

  const recordHoveredEpic = action$ => action$.pipe(hd_componentsUtils.isCreator(hd_componentsOrderBook.recordHoveredAction), operators.map(({
    payload: {
      groupId,
      side,
      entity
    }
  }) => highlightOrderAction(groupId, side, entity)));

  const getEqual = (subscription, side) => {
    if (!subscription) {
      return {
        orders: [],
        deleted: []
      };
    }

    const records = [];

    const orderLoop = (equalPriceRecord, index) => {
      const order = equalPriceRecord.orders[index];
      const orderFits = records.length < hd_componentsCommon.levelsOnScreen;

      if (order !== undefined && orderFits) {
        records.push({
          id: order.id,
          price: equalPriceRecord.price,
          quantity: order.quantity,
          exchange: order.exchange,
          level: order.level,
          orderCount: order.numberOfOrders
        });
        orderLoop(equalPriceRecord, index + 1);
      }
    };

    const equalPriceRecordLoop = index => {
      const equalPriceRecord = subscription[side].aggregated.price.equal.records[index];
      const recordFits = records.length < hd_componentsCommon.levelsOnScreen;

      if (equalPriceRecord !== undefined && recordFits) {
        orderLoop(equalPriceRecord, 0);
        equalPriceRecordLoop(index + 1);
      }
    };

    equalPriceRecordLoop(0);
    return {
      orders: records,
      deleted: subscription[side].aggregated.price.equal.deleted
    };
  };

  const getAggregated = aggregated => {
    if (!aggregated) {
      return {
        orders: [],
        deleted: []
      };
    }

    const records = aggregated.records.slice(0, hd_componentsCommon.levelsOnScreen).map(aggregatedRecord => ({
      id: aggregatedRecord.id,
      price: aggregatedRecord.price,
      quantity: aggregatedRecord.quantity,
      worstPrice: aggregatedRecord.worstPrice,
      orderCount: aggregatedRecord.numberOfOrders
    }));
    return {
      orders: records,
      deleted: aggregated.deleted
    };
  };

  const getSide = (subscription, side) => {
    const result = {
      aggregated: {
        price: {
          equal: getEqual(subscription, side)
        },
        quantity: {}
      }
    };
    subscription.parameters.aggregation.price.forEach(priceParameter => {
      result.aggregated.price[priceParameter.value] = getAggregated(subscription[side].aggregated.price[priceParameter.value]);
    });
    subscription.parameters.aggregation.quantity.forEach(quantityParameter => {
      result.aggregated.quantity[quantityParameter.value] = getAggregated(subscription[side].aggregated.quantity[quantityParameter.value]);
    });
    return result;
  };

  const getSpread = subscription => {
    if (!subscription) {
      return decimalUtils.ZERO;
    }

    const buy = subscription.buy.aggregated.price.equal.records;
    const sell = subscription.sell.aggregated.price.equal.records;

    if (buy.length === 0 || sell.length === 0) {
      return decimalUtils.ZERO;
    }

    return sell[0].price.sub(buy[0].price);
  };

  const updateGridEpic = (action$, state$, {
    symbol
  }) => action$.pipe(hd_componentsOrderBook.dataHandledFor(symbol), operators.map(({
    payload: {
      symbol
    }
  }) => {
    const subscription = hd_componentsOrderBook.getOrderBookSubscription(state$.value, symbol);
    const sell = getSide(subscription, hd_componentsOrderBook.L2MessageSide.sell);
    const buy = getSide(subscription, hd_componentsOrderBook.L2MessageSide.buy);
    const spread = getSpread(subscription);
    return [updateGridAction(buy, sell, spread), hd_componentsOrderBook.clearDeletedAction()];
  }), operators.concatAll());

  const orderGridWorkerEpic = reduxObservable.combineEpics(updateGridEpic, recordHoveredEpic, noHoveredRecordsEpic);

  exports.highlightOrderAction = highlightOrderAction;
  exports.noOrderToHighlightAction = noOrderToHighlightAction;
  exports.orderGridEpicType = orderGridEpicType;
  exports.orderGridWorkerEpic = orderGridWorkerEpic;
  exports.orderHoveredAction = orderHoveredAction;
  exports.updateGridAction = updateGridAction;
  exports.updateParametersAction = updateParametersAction;
  exports.updateUserOrdersAction = updateUserOrdersAction;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
