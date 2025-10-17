---
title: Stateful Functions
tags: [qql, stateful_functions, functions, running, trigger, reset, time_windows, count_windows, aggregation, indicators, orderbook, examples, syntax, init_args, catalog]
---

[[SECTION:OVERVIEW]]
[[TAGS: OVERVIEW PURPOSE STATEFUL]]
Stateful functions maintain internal incremental or windowed state across messages (optionally per GROUP BY partition). They require use of {} after the function name to distinguish from stateless functions.

[[SECTION:CORE_KEYWORDS]]
[[TAGS: KEYWORDS RUNNING OVER TIME TRIGGER RESET COUNT TIME WINDOWS]]
Keywords:

- RUNNING: the result is returned for every input message. For example we compute running max, 
           it means, that for each message we receive max for this message and all previous messages in a group.
- OVER TIME(<interval>): segment evaluation into fixed time windows (bounded scope).
- OVER COUNT(<n>): segment evaluation into fixed message-count windows.
- TRIGGER OVER TIME|COUNT(...): compute over entire stream (cumulative) but emit snapshots on schedule.
- RESET OVER TIME|COUNT(...): reset state each period without forcing snapshot.
- EVERY (if supported with TRIGGER/OVER): emit empty-period snapshots.

[[SECTION:TEMPLATE_TIME]]
[[TAGS: TEMPLATE TIME WINDOW SYNTAX]]
Time window template:
SELECT [RUNNING] func{initArgs}(args)
FROM "stream" [TRIGGER|RESET] OVER TIME(<interval>)

[[SECTION:TEMPLATE_COUNT]]
[[TAGS: TEMPLATE COUNT WINDOW SYNTAX]]
Count window template:
SELECT [RUNNING] func{initArgs}(args)
FROM "stream" [TRIGGER|RESET] OVER COUNT(<number>)

[[SECTION:FUNCTION_SYNTAX]]
[[TAGS: SYNTAX INIT_ARGS POSITIONAL NAMED]]
Syntax:
function{initArg1: value1, initArg2: value2}(arg1, arg2)
or positional init arguments:
function{value1, value2}(arg1, arg2)
Init (brace) arguments are constant; dynamic fields go in parentheses.

[[SECTION:EMISSION_SEMANTICS]]
[[TAGS: EMISSION RUNNING TRIGGER RESET]]
Emission rules:

- Plain SELECT (no RESET, no TRIGGER): emit at window close or end-of-stream (implementation dependent).
- TRIGGER + window: periodic snapshot; internal scope cumulative unless RESET used.
- RESET + window: per message updates; state cleared each period boundary.

[[SECTION:BASIC_EXAMPLES]]
[[TAGS: EXAMPLES BASIC MAX MIN COUNT]]
Max over entire stream (single final or periodic if windowed):
SELECT max{}(price) FROM "quotes"
Running cumulative max per message:
SELECT max{}(price) FROM "quotes"
Count messages:
SELECT count{}() FROM "quotes"

[[SECTION:TIME_WINDOW_EXAMPLES]]
[[TAGS: EXAMPLES TIME WINDOW]]
Max per 1h window (emit on close):
SELECT max{}(price) FROM "quotes" OVER TIME(1h)
Running max inside each 10m window:
SELECT max{}(price) FROM "quotes" OVER TIME(10m)

[[SECTION:COUNT_WINDOW_EXAMPLES]]
[[TAGS: EXAMPLES COUNT WINDOW]]
Max per 10-message batches:
SELECT max{}(price) FROM "quotes" OVER COUNT(10)
Running max, reset every 100 messages:
SELECT max{}(price) RESET OVER COUNT(100)

[[SECTION:TRIGGER_EXAMPLES]]
[[TAGS: EXAMPLES TRIGGER SNAPSHOT]]
Snapshot cumulative max every 10m:
SELECT max{}(price) FROM "quotes" TRIGGER OVER TIME(10m)
Snapshot cumulative max every 500 messages:
SELECT max{}(price) FROM "quotes" TRIGGER OVER COUNT(500)

[[SECTION:RESET_EXAMPLES]]
[[TAGS: EXAMPLES RESET PERIODIC]]
Running max that restarts every 30m:
SELECT max{}(price) FROM "quotes" RESET OVER TIME(30m)

[[SECTION:ARRAY_FILTERING_CONTEXT]]
[[TAGS: ARRAYS FILTERING PREPROCESS]]
Pre-filter array then aggregate:
WITH entries[side == BID].price AS 'bidPrices'
SELECT max{}(max(bidPrices)) FROM "l2stream" OVER TIME(5m)

[[SECTION:ORDERBOOK_EXAMPLE]]
[[TAGS: ORDERBOOK L2 SNAPSHOT]]
Build L2 order book snapshot every 10s (depth 10):
SELECT orderBook{maxDepth: 10}(packageType, entries)
FROM "bitfinex" OVER TIME(10s)
WHERE symbol == 'BTC/USDT'

[[SECTION:POLYMORPHIC_CAST_EXAMPLE]]
[[TAGS: POLYMORPHIC CAST FILTER]]
Select only trade entries then running volume:
WITH entries[THIS IS deltix.timebase.api.messages.universal.TradeEntry] AS 'trades'
SELECT sum{}(sum(trades.size)) FROM "bitfinex" OVER TIME(1m) WHERE symbol == 'BTCUSD'

[[SECTION:BAR_BUILDING_EXAMPLE]]
[[TAGS: BARS OHLC AGGREGATION]]
One‑minute OHLCV bars from trade entries:
WITH entries[THIS IS deltix.timebase.api.messages.universal.TradeEntry] AS 'trades'
SELECT
sum{}(sum(trades.size)) AS 'volume',
first{}(trades[0].price) AS 'open',
last{}(trades[-1].price) AS 'close',
max{}(max(trades.price)) AS 'high',
min{}(min(trades.price)) AS 'low'
FROM "bitfinex"
OVER TIME(1m)
WHERE symbol == 'BTCUSD' AND size(trades) > 0

[[SECTION:INDICATORS_EXAMPLE]]
[[TAGS: INDICATORS SMA BOLLINGER CMA]]
Simple moving average 1h:
SELECT sma{timePeriod: 1h}(price) FROM "quotes"
Bollinger + extraction (field expansion concept if supported):
SELECT (bollinger{timeWindow: 1h}(price) AS 'b').* FROM "quotes"
Cumulative moving average:
SELECT cma{}(price) FROM "quotes"

[[SECTION:VWAP_EXAMPLES]]
[[TAGS: VWAP SUM DIVISION]]
VWAP per 1m:
WITH entries[THIS IS deltix.timebase.api.messages.universal.TradeEntry] AS 't'
SELECT sum{}(t.price *t.size) / sum{}(t.size)
FROM "bitfinex"
OVER TIME(1m)
WHERE symbol == 'BTCUSD'
Cumulative VWAP snapshots every 1m:
WITH entries[THIS IS deltix.timebase.api.messages.universal.TradeEntry] AS 't'
SELECT sum{}(t.price* t.size) / sum{}(t.size)
FROM "bitfinex"
TRIGGER OVER TIME(1m)
WHERE symbol == 'BTCUSD'

[[SECTION:UNIQUE_COUNT_EXAMPLE]]
[[TAGS: UNIQUE DISTINCT SYMBOLS]]
Unique FX instrument count:
SELECT size(collect_unique{}(symbol)) FROM "securities"
WHERE type == "deltix.timebase.api.messages.InstrumentType":FX

[[SECTION:INDICATOR_CHAINING]]
[[TAGS: CHAINING MULTI FUNCTION]]
Chaining example (running SMA + EMA):
SELECT
sma{timePeriod: 30m}(price) AS 'sma30',
ema{period: 20}(price) AS 'ema20'
FROM "quotes"
OVER TIME(2h)

[[SECTION:FUNCTION_CATALOG]]
[[TAGS: CATALOG SUMMARY LIST]]
Catalog (init args → effect):

- count{}(): message count. No args needed.
- max{}(x), min{}(x): extrema (timePeriod/period init optional forms).
- sum{}(x), avg{}(x): accumulation / average (window or cumulative variants).
- sma{timePeriod|period}(x): simple moving average (time or count window).
- cma{}(x): cumulative moving average.
- ema{period|factor}(x): exponential moving average.
- bollinger{pointWindow, factor}(x): Bollinger bands (structured result).
- kama{period}(x), lsma{pointWindow|timeWindow, useDateTime}(x), mma{period}(x): alternative smoothing averages.
- adxr{period}(o,h,l,c,v), atr{period}(o,h,l,c,v): volatility / directional metrics.
- collect_unique{}(symbol): array of distinct strings.
- lastNotNull{}(x): forward-fills nulls.
- window{period|timePeriod}(x): returns sliding window array.
- orderBook{maxDepth}(packageType, entries): builds L2 snapshot.
- statWindow{period|timePeriod}(x): statistics object (sum, count, variance, etc.).

[[SECTION:BEST_PRACTICES]]
[[TAGS: PRACTICES GUIDELINES]]

1. Always pair stateful {} calls with RUNNING when per-message emission required.
2. Use TRIGGER for sparse periodic snapshots without per-message noise.
3. Prefer RESET when needing clean segmented running metrics.
4. Keep window size aligned with data frequency (avoid oversized sparse windows).
5. Minimize nested aggregations; pre-filter arrays before stateful call.

[[SECTION:ERROR_PATTERNS]]
[[TAGS: ERRORS DIAGNOSTICS]]
Common issues:

- Using stateful {} inside WITH when unsupported.
- Misordered clause (OVER TIME after WHERE).
- Mixing cumulative TRIGGER with unintended windowed expectation.
- Invalid init arg name (mismatch to function signature).

[[SECTION:REFERENCE_END]]
[[TAGS: END STATEFUL FUNCTIONS REFERENCE]]
End of stateful functions reference.
