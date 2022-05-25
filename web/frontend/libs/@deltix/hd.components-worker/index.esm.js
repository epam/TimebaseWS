import { depthChartEpicType, depthChartWorkerEpic, updateDepthChartAction, highlightPriceAction, noPriceToHighlightAction } from '@deltix/hd.components-depth-chart-common';
import { calculateTradingAmountEpicType, calculateTradingAmountEpic, tradingAmountAction, createOrderBookStore } from '@deltix/hd.components-order-book';
import { orderGridEpicType, orderGridWorkerEpic, updateGridAction, highlightOrderAction, noOrderToHighlightAction } from '@deltix/hd.components-order-grid-common';
import { tradeHistoryEpicType, tradeHistoryWorkerEpic, addTradeAction } from '@deltix/hd.components-trade-history-common';
import { getType } from '@deltix/hd.components-utils';

(() => {
  const epics = [{
    epicType: depthChartEpicType,
    epic: depthChartWorkerEpic,
    outActionTypes: [getType(updateDepthChartAction), getType(highlightPriceAction), getType(noPriceToHighlightAction)]
  }, {
    epicType: tradeHistoryEpicType,
    epic: tradeHistoryWorkerEpic,
    outActionTypes: [getType(addTradeAction)]
  }, {
    epicType: orderGridEpicType,
    epic: orderGridWorkerEpic,
    outActionTypes: [getType(updateGridAction), getType(highlightOrderAction), getType(noOrderToHighlightAction)]
  }, {
    epicType: calculateTradingAmountEpicType,
    epic: calculateTradingAmountEpic,
    outActionTypes: [getType(tradingAmountAction)]
  }];
  createOrderBookStore(epics);
})();
