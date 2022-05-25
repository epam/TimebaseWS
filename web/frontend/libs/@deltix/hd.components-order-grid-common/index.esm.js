import { combineEpics } from 'redux-observable';
import { noHoveredRecordsAction, recordHoveredAction, dataHandledFor, getOrderBookSubscription, L2MessageSide as L2MessageSide$1, clearDeletedAction } from '@deltix/hd.components-order-book';
import { isCreator } from '@deltix/hd.components-utils';
import { map, concatAll } from 'rxjs/operators';
import { ZERO } from '@deltix/decimal-utils';
import { levelsOnScreen } from '@deltix/hd.components-common';

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
var L2MessageSide;

(function (L2MessageSide) {
  L2MessageSide["buy"] = "buy";
  L2MessageSide["sell"] = "sell";
})(L2MessageSide || (L2MessageSide = {}));

const noHoveredRecordsEpic = action$ => action$.pipe(isCreator(noHoveredRecordsAction), map(({
  payload: {
    groupId
  }
}) => noOrderToHighlightAction(groupId)));

const recordHoveredEpic = action$ => action$.pipe(isCreator(recordHoveredAction), map(({
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
    const orderFits = records.length < levelsOnScreen;

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
    const recordFits = records.length < levelsOnScreen;

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

  const records = aggregated.records.slice(0, levelsOnScreen).map(aggregatedRecord => ({
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
    return ZERO;
  }

  const buy = subscription.buy.aggregated.price.equal.records;
  const sell = subscription.sell.aggregated.price.equal.records;

  if (buy.length === 0 || sell.length === 0) {
    return ZERO;
  }

  return sell[0].price.sub(buy[0].price);
};

const updateGridEpic = (action$, state$, {
  symbol
}) => action$.pipe(dataHandledFor(symbol), map(({
  payload: {
    symbol
  }
}) => {
  const subscription = getOrderBookSubscription(state$.value, symbol);
  const sell = getSide(subscription, L2MessageSide$1.sell);
  const buy = getSide(subscription, L2MessageSide$1.buy);
  const spread = getSpread(subscription);
  return [updateGridAction(buy, sell, spread), clearDeletedAction()];
}), concatAll());

const orderGridWorkerEpic = combineEpics(updateGridEpic, recordHoveredEpic, noHoveredRecordsEpic);

export { L2MessageSide, highlightOrderAction, noOrderToHighlightAction, orderGridEpicType, orderGridWorkerEpic, orderHoveredAction, updateGridAction, updateParametersAction, updateUserOrdersAction };
