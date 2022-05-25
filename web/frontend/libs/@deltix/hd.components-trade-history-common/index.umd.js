(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@deltix/decimal-utils'), require('@deltix/hd.components-order-book'), require('@deltix/hd.components-utils'), require('rxjs/operators')) :
  typeof define === 'function' && define.amd ? define(['exports', '@deltix/decimal-utils', '@deltix/hd.components-order-book', '@deltix/hd.components-utils', 'rxjs/operators'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.TradeHistoryCommon = {}, global.decimalUtils, global.hd_componentsOrderBook, global.hd_componentsUtils, global.operators));
})(this, (function (exports, decimalUtils, hd_componentsOrderBook, hd_componentsUtils, operators) { 'use strict';

  const tradeHistoryEpicType = 'tradeHistory';

  const addTradeAction = trades => ({
    type: 'ADD_TRADE',
    payload: {
      trades
    }
  });

  const l2ToTrade = ({
    side,
    price,
    quantity
  }, time, id, exchange) => ({
    side,
    price: decimalUtils.toDecimal(price),
    quantity: decimalUtils.toDecimal(quantity),
    time,
    id,
    exchange
  });

  const tradeHistoryWorkerEpic = action$ => action$.pipe(hd_componentsUtils.isCreator(hd_componentsOrderBook.tradeAction), operators.map(({
    payload: {
      trade,
      exchange,
      timestamp
    }
  }, id) => addTradeAction([l2ToTrade(trade, trade.timestamp != null ? trade.timestamp : timestamp, id, exchange)])));

  exports.addTradeAction = addTradeAction;
  exports.tradeHistoryEpicType = tradeHistoryEpicType;
  exports.tradeHistoryWorkerEpic = tradeHistoryWorkerEpic;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
