(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('@deltix/hd.components-depth-chart-common'), require('@deltix/hd.components-order-book'), require('@deltix/hd.components-order-grid-common'), require('@deltix/hd.components-trade-history-common'), require('@deltix/hd.components-utils')) :
  typeof define === 'function' && define.amd ? define(['@deltix/hd.components-depth-chart-common', '@deltix/hd.components-order-book', '@deltix/hd.components-order-grid-common', '@deltix/hd.components-trade-history-common', '@deltix/hd.components-utils'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.hd_componentsDepthChartCommon, global.hd_componentsOrderBook, global.hd_componentsOrderGridCommon, global.hd_componentsTradeHistoryCommon, global.hd_componentsUtils));
})(this, (function (hd_componentsDepthChartCommon, hd_componentsOrderBook, hd_componentsOrderGridCommon, hd_componentsTradeHistoryCommon, hd_componentsUtils) { 'use strict';

  (() => {
    const epics = [{
      epicType: hd_componentsDepthChartCommon.depthChartEpicType,
      epic: hd_componentsDepthChartCommon.depthChartWorkerEpic,
      outActionTypes: [hd_componentsUtils.getType(hd_componentsDepthChartCommon.updateDepthChartAction), hd_componentsUtils.getType(hd_componentsDepthChartCommon.highlightPriceAction), hd_componentsUtils.getType(hd_componentsDepthChartCommon.noPriceToHighlightAction)]
    }, {
      epicType: hd_componentsTradeHistoryCommon.tradeHistoryEpicType,
      epic: hd_componentsTradeHistoryCommon.tradeHistoryWorkerEpic,
      outActionTypes: [hd_componentsUtils.getType(hd_componentsTradeHistoryCommon.addTradeAction)]
    }, {
      epicType: hd_componentsOrderGridCommon.orderGridEpicType,
      epic: hd_componentsOrderGridCommon.orderGridWorkerEpic,
      outActionTypes: [hd_componentsUtils.getType(hd_componentsOrderGridCommon.updateGridAction), hd_componentsUtils.getType(hd_componentsOrderGridCommon.highlightOrderAction), hd_componentsUtils.getType(hd_componentsOrderGridCommon.noOrderToHighlightAction)]
    }, {
      epicType: hd_componentsOrderBook.calculateTradingAmountEpicType,
      epic: hd_componentsOrderBook.calculateTradingAmountEpic,
      outActionTypes: [hd_componentsUtils.getType(hd_componentsOrderBook.tradingAmountAction)]
    }];
    hd_componentsOrderBook.createOrderBookStore(epics);
  })();

}));
