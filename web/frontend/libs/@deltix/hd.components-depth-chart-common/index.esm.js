import { combineEpics } from 'redux-observable';
import { noHoveredRecordsAction, recordHoveredAction, dataHandledFor, getOrderBookSubscription } from '@deltix/hd.components-order-book';
import { isCreator, bigHelper } from '@deltix/hd.components-utils';
import { map, startWith } from 'rxjs/operators';
import { ZERO as ZERO$1 } from '@deltix/decimal-utils';
import { combineLatest } from 'rxjs';
import { ZERO } from '@deltix/decimal-utils/dist/utils';

const depthChartEpicType = 'depthChartEpic';
var EOrientations;

(function (EOrientations) {
  EOrientations["price"] = "price";
  EOrientations["quantity"] = "quantity";
})(EOrientations || (EOrientations = {}));

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

const noHoveredRecordsEpic = action$ => action$.pipe(isCreator(noHoveredRecordsAction), map(({
  payload: {
    groupId
  }
}) => noPriceToHighlightAction(groupId)));

const recordHoveredEpic = action$ => action$.pipe(isCreator(recordHoveredAction), map(({
  payload: {
    groupId,
    side,
    entity
  }
}) => highlightPriceAction(groupId, side, entity)));

const getPriceSlice = (dataSet, limitPrice, isSell, middlePrice) => {
  const prices = [];
  let quantitySum = ZERO;
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
    return ZERO;
  }

  return prices[0].price.minus(prices[prices.length - 1].price).abs();
};

const getLimitPrice = (buy, sell, zoom) => {
  const midPrice = getMiddlePrice(buy, sell);
  let range = bigHelper.min(getPriceRange(buy), getPriceRange(sell)).mul(zoom);
  const spread = sell[0] && buy[0] ? sell[0].price.sub(buy[0].price) : (sell[0] || buy[0]).price;

  if (spread.gt(ZERO)) {
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

const emptyAction = updateDepthChartAction([], [], ZERO$1);

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
}) => combineLatest(action$.pipe(isCreator(depthChartZoomAction), map(({
  payload: {
    zoom
  }
}) => zoom), startWith(1)), action$.pipe(dataHandledFor(spawnedSymbol))).pipe(map(([zoom, {
  payload: {
    symbol
  }
}]) => {
  const subscription = getOrderBookSubscription(state$.value, symbol);
  return createUpdateAction(subscription ? subscription.buy.aggregated.price.equal.records : [], subscription ? subscription.sell.aggregated.price.equal.records : [], zoom);
}));

const depthChartWorkerEpic = combineEpics(updateEpic, recordHoveredEpic, noHoveredRecordsEpic);

export { EOrientations, depthChartEpicType, depthChartWorkerEpic, depthChartZoomAction, highlightPriceAction, noPriceToHighlightAction, updateDepthChartAction, updateParametersAction };
