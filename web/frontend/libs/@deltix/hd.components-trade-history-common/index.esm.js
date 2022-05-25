import { toDecimal } from '@deltix/decimal-utils';
import { tradeAction } from '@deltix/hd.components-order-book';
import { isCreator } from '@deltix/hd.components-utils';
import { map } from 'rxjs/operators';

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
  price: toDecimal(price),
  quantity: toDecimal(quantity),
  time,
  id,
  exchange
});

const tradeHistoryWorkerEpic = action$ => action$.pipe(isCreator(tradeAction), map(({
  payload: {
    trade,
    exchange,
    timestamp
  }
}, id) => addTradeAction([l2ToTrade(trade, trade.timestamp != null ? trade.timestamp : timestamp, id, exchange)])));

export { addTradeAction, tradeHistoryEpicType, tradeHistoryWorkerEpic };
