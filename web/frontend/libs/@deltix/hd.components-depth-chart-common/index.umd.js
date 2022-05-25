(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('redux-observable'), require('@deltix/hd.components-order-book'), require('@deltix/hd.components-utils'), require('rxjs/operators'), require('@deltix/decimal-utils'), require('rxjs'), require('@deltix/decimal-utils/dist/utils')) :
  typeof define === 'function' && define.amd ? define(['exports', 'redux-observable', '@deltix/hd.components-order-book', '@deltix/hd.components-utils', 'rxjs/operators', '@deltix/decimal-utils', 'rxjs', '@deltix/decimal-utils/dist/utils'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.DepthChartCommon = {}, global.reduxObservable, global.hd_componentsOrderBook, global.hd_componentsUtils, global.operators, global.decimalUtils, global.rxjs, global.utils));
})(this, (function (exports, reduxObservable, hd_componentsOrderBook, hd_componentsUtils, operators, decimalUtils, rxjs, utils) { 'use strict';

  const depthChartEpicType = 'depthChartEpic';
  exports.EOrientations = void 0;

  (function (EOrientations) {
    EOrientations["price"] = "price";
    EOrientations["quantity"] = "quantity";
  })(exports.EOrientations || (exports.EOrientations = {}));

  const updateDepthChartAction = (buy, sell, middlePrice) => ({
    type: '@DEPTH_CHART/UPDATE',
    payload: {
      buy,
      sell,
      middlePrice
    }
  });
  const depthChartZoomAction = zoom => ({
    type: '@DEPTH_CHART/ZOOM',
    payload: {
      zoom
    }
  });
  const highlightPriceAction = (groupId, side, entity) => ({
    type: '@DEPTH_CHART/HIGHLIGHT_PRICE_ACTION',
    payload: {
      groupId,
      side,
      entity
    }
  });
  const noPriceToHighlightAction = groupId => ({
    type: '@DEPTH_CHART/NOT_PRICE_TO_HIGHLIGHT_ACTION',
    payload: {
      groupId
    }
  });
  /**
   * API
   */

  const updateParametersAction = parameters => {
    // depthChartUpdateParametersValidator(parameters);
    return {
      type: '@DEPTH_CHART/UPDATE_PARAMETERS',
      payload: {
        parameters
      }
    };
  };

  const noHoveredRecordsEpic = action$ => action$.pipe(hd_componentsUtils.isCreator(hd_componentsOrderBook.noHoveredRecordsAction), operators.map(({
    payload: {
      groupId
    }
  }) => noPriceToHighlightAction(groupId)));

  const recordHoveredEpic = action$ => action$.pipe(hd_componentsUtils.isCreator(hd_componentsOrderBook.recordHoveredAction), operators.map(({
    payload: {
      groupId,
      side,
      entity
    }
  }) => highlightPriceAction(groupId, side, entity)));

  const getPriceSlice = (dataSet, limitPrice, isSell, middlePrice) => {
    const prices = [];
    let quantitySum = utils.ZERO;
    let pricesAfterMiddle = 0;

    for (let i = 0; i < dataSet.length - 1; i++) {
      const item = dataSet[i];
      const price = item.price;
      quantitySum = quantitySum.add(item.quantity); // insure that at least two price exists in data set

      if (isSell) {
        if (price.gte(middlePrice)) {
          pricesAfterMiddle++;
        }

        if (price.gt(limitPrice) && pricesAfterMiddle > 2) {
          break;
        }
      } else {
        if (price.lte(middlePrice)) {
          pricesAfterMiddle++;
        }

        if (price.lt(limitPrice) && pricesAfterMiddle > 2) {
          break;
        }
      }

      prices.push({
        price,
        sum: quantitySum
      });
    }

    return prices;
  }; // todo will be affected


  const getMiddlePrice = (buy, sell) => {
    if (buy[0] === undefined) {
      return sell[0].price;
    }

    if (sell[0] === undefined) {
      return buy[0].price;
    }

    return buy[0].price.add(sell[0].price).div(2);
  };

  const getPriceRange = prices => {
    if (!prices.length) {
      return utils.ZERO;
    }

    return prices[0].price.minus(prices[prices.length - 1].price).abs();
  };

  const getLimitPrice = (buy, sell, zoom) => {
    const midPrice = getMiddlePrice(buy, sell);
    let range = hd_componentsUtils.bigHelper.min(getPriceRange(buy), getPriceRange(sell)).mul(zoom);
    const spread = sell[0] && buy[0] ? sell[0].price.sub(buy[0].price) : (sell[0] || buy[0]).price;

    if (spread.gt(utils.ZERO)) {
      range = range.add(spread);
    }

    const sellLimit = midPrice.add(range);
    const buyLimit = midPrice.sub(range);
    return {
      sellLimit,
      buyLimit
    };
  };

  const createUpdate = (buy, sell, zoom) => {
    const {
      buyLimit,
      sellLimit
    } = getLimitPrice(buy, sell, zoom);
    const midPrice = getMiddlePrice(buy, sell);
    const sellPrices = getPriceSlice(sell, sellLimit, true, midPrice);
    const buyPrices = getPriceSlice(buy, buyLimit, false, midPrice);
    return {
      buyPrices,
      sellPrices,
      midPrice: getMiddlePrice(buy, sell)
    };
  };

  const emptyAction = updateDepthChartAction([], [], decimalUtils.ZERO);

  const createUpdateAction = (buy, sell, zoom) => {
    if (buy.length === 0 && sell.length === 0) {
      return emptyAction;
    }

    const {
      buyPrices,
      sellPrices,
      midPrice
    } = createUpdate(buy, sell, zoom);
    return updateDepthChartAction(buyPrices, sellPrices, midPrice);
  };

  const updateEpic = (action$, state$, {
    symbol: spawnedSymbol
  }) => rxjs.combineLatest(action$.pipe(hd_componentsUtils.isCreator(depthChartZoomAction), operators.map(({
    payload: {
      zoom
    }
  }) => zoom), operators.startWith(1)), action$.pipe(hd_componentsOrderBook.dataHandledFor(spawnedSymbol))).pipe(operators.map(([zoom, {
    payload: {
      symbol
    }
  }]) => {
    const subscription = hd_componentsOrderBook.getOrderBookSubscription(state$.value, symbol);
    return createUpdateAction(subscription ? subscription.buy.aggregated.price.equal.records : [], subscription ? subscription.sell.aggregated.price.equal.records : [], zoom);
  }));

  const depthChartWorkerEpic = reduxObservable.combineEpics(updateEpic, recordHoveredEpic, noHoveredRecordsEpic);

  exports.depthChartEpicType = depthChartEpicType;
  exports.depthChartWorkerEpic = depthChartWorkerEpic;
  exports.depthChartZoomAction = depthChartZoomAction;
  exports.highlightPriceAction = highlightPriceAction;
  exports.noPriceToHighlightAction = noPriceToHighlightAction;
  exports.updateDepthChartAction = updateDepthChartAction;
  exports.updateParametersAction = updateParametersAction;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
