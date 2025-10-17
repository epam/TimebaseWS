---
title: FAQ
tags: [
  qql, faq, frequently asked questions, market data, package header, 
  trades, quotes, order book, aggregation, functions
]
---

# FAQ

I have market data stored in a stream of a `package header` format. How can I select all `trades` and/or `L1` quotes from this stream?
--------------------------------------------------------------------------------------------------------------------------------------

### Answer

`package header` format stores all data in an array of polymorphic objects called `entries`. Use `array join` construction to 'unfold' this array into separate `entry` messages, and filter them by type (`TradeEntry`, `L1Entry`, etc).
```qql
--Query example  
SELECT entry.exchangeId, entry.price, entry.size TYPE "Trade"  
FROM "COINBASE"   
ARRAY JOIN entries AS entry  
WHERE entry IS TradeEntry  
```

When I select `entry.side` I get an error.
------------------------------------------

### Question

I got an error related with the `entry.side` field when I tried selecting `trades` from the stream.

Error message: "Illegal type in: ENTRY.SIDE; Types should be equal".

### Answer

The elements of the `entries` array can be of various types: `TradeEntry`, `L1Entry`, `L2EntryNew`, and `L2EntryUpdate`. Potentially, there may be an ambiguity with the `side` field because it can have differing types - `AggressorSide` for `TradeEntry.side` and `QuoteSide` for others.

To resolve this, you can cast the `entries` array to a fixed array of type `TradeEntry` using the syntax this syntax: `array(TradeEntry)`:

```qql
SELECT entry.exchangeId, entry.price, entry.size, entry.side TYPE "Trade"  
FROM "COINBASE"   
ARRAY JOIN entries AS array(TradeEntry) AS entry  
WHERE entry IS TradeEntry  
```

How can I *fill* gaps with the last available value?
----------------------------------------------------

### Question

I am trying to calculate spread for L1 market data. But the problem is that I cannot do it by taking the difference between bids and asks because quotes in my data have different timestamps and there are also missing price values here and there. I want to resolve this by *filling* the missing price values with the last available data. How do I do that?

```qql
SELECT  
  entry[side == ASK].price AS askPrice,   
  entry[side == BID].price AS bidPrice  
FROM "BINANCE"  
ARRAY JOIN entries AS array(L1Entry) AS entry  
WHERE entry != null AND symbol == 'BTC/USDT'  
```

### Answer

Use `lastNotNull{}(field)` function with `SELECT RUNNING` keyword construction. You need a `RUNNING` keyword to avoid calculating results for the entire stream.

```qql
SELECT RUNNING  
  lastNotNull{}(entry[side == ASK].price) AS askPrice,   
  lastNotNull{}(entry[side == BID].price) AS bidPrice,  
  askPrice - bidPrice AS spread  
FROM "BINANCE"  
ARRAY JOIN entries AS array(L1Entry) AS entry  
WHERE entry != null AND symbol == 'BTC/USDT'  
```

I want to build an order book snapshot for each message in the stream.
----------------------------------------------------------------------

### Answer

Use, `orderBook{}()` function. This function builds an order book by combining the snapshot with incremental updates of data stored in the stream.
It then returns the current state of the order book as a snapshot in the `package header` format.

```qql
WITH  
orderbook{maxDepth: 20}(packageType, entries) AS book  
SELECT RUNNING   
book AS entries, PERIODICAL_SNAPSHOT AS packageType TYPE "deltix.timebase.api.messages.universal.PackageHeader"  
FROM "BINANCE"  
WHERE symbol == 'BTC/USD'  
```

How to *flatten* order book entries?
------------------------------------

### Question

I have an order books built from a `package header` stream. How can I take the `entries` array and represent its elements as individual `messages`?

For example, I want to take top 2 levels of an order book and *flatten* them, so each `entries` array element is projected into a separate `message`.
I would expect the result looking like this:
```
symbol, timestamp, exchangeId, price, size, level, side  
BTCTUSD, 2023-04-25T13:07:30.758Z, BINANCE, 27441.29, 0.9988, 0, ASK  
BTCTUSD, 2023-04-25T13:07:30.758Z, BINANCE, 27441.58, 0.12762, 1, ASK  
BTCTUSD, 2023-04-25T13:07:30.758Z, BINANCE, 27441.28, 0.00026, 0, BID  
BTCTUSD, 2023-04-25T13:07:30.758Z, BINANCE, 27441.21, 0.0004, 1, BID  
```

### Answer

Use this query:
```qql
WITH  
    orderbook{maxDepth: 2}(this.packageType, this.entries[not this is TradeEntry]) AS book  
SELECT RUNNING  
    book_entry.exchangeId AS 'exchangeId',  
    book_entry.price AS 'price',  
    book_entry.size AS 'size',  
    book_entry.level AS 'level',  
    book_entry.side AS 'side'  
FROM "BINANCE"   
ARRAY JOIN book AS array(L2EntryNew) AS book_entry  
WHERE symbol == 'BTCTUSD'  
```

What query can I use to count messages by day?
----------------------------------------------

### Answer

Use `over time` construction to aggregate values:
```qql
SELECT count{}() FROM "BINANCE"   
OVER TIME(1d)  
```

How to calculate a message rate over 1 second intervals or 1 minute intervals for the **universal market data** format?
-----------------------------------------------------------------------------------------------------------------------

### Answer

To calculate rates in a single query, use the `UNION` construction:

```qql
SELECT count{}() AS 'seconds_rate' FROM "COINBASE"   
OVER TIME(1s)  
UNION  
SELECT count{}() AS 'minutes_rate' FROM "COINBASE"   
OVER TIME(1m)  
```

Refer to UNION to learn more.

How to calculate a maximum size of the `entries` array in `PackageHeader` snapshots?
------------------------------------------------------------------------------------

### Answer

To calculate the maximum size of the `entries` array in `PackageHeader` snapshots, use the `max{}` function:
```qql
SELECT max{}(size(entries)) FROM "COINBASE"   
where packageType == PERIODICAL_SNAPSHOT  
```
Refer to functions to learn more.

In a TimeBase stream containing bars for two symbols BTCUSDT and ETHUSDT, is it possible to select the prices of BTCUSDT and ETHUSDT in a single row and calculate the difference between them?
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### Answer

Use the `if` operator to filter the price for the specified symbol. Then, utilize the `lastNotNull{}()` function to fill any gaps in the results.
```qql
WITH  
lastNotNull{}(closeAsk if symbol == 'BTCUSDT') AS 'price1',  
lastNotNull{}(closeAsk if symbol == 'ETHUSDT') AS 'price2'  
SELECT RUNNING   
price1, price2, price1 - price2 AS diff   
FROM Bars  
WHERE symbol IN ('BTCUSDT', 'ETHUSDT') and price1 != null and price2 != null  
```

How can I create a query to retrieve prices for the same symbol available on two exchanges? For example, I want to find the price difference of BTC/USDT between BINANCE and BITFINEX (spread).
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### Answer

To achieve this, construct two order books for each exchange utilizing the `OrderBook{}()` function.
Use the `UNION` keyword to select from both streams.
First, filter entries from the stream for each exchange using a predicate like `((THIS.entries[exchangeId == 'BINANCE']) as 'BinanceEntries')`.
Then, pass the filtered data into the `OrderBook{}()` function and fill any gaps using `lastNotNull{}()`.
Finally, calculate the spread from the top of the order books.

```qql
with  
(THIS.entries[exchangeId == 'BINANCE']) as 'BinanceEntries',  
(THIS.entries[exchangeId == 'BITFINEX']) as 'BitfinexEntries',  
lastNotNull{}(ORDERBOOK{}(THIS.packageType, BinanceEntries)) AS array(L2EntryNew) AS 'BinanceBook',  
lastNotNull{}(ORDERBOOK{}(THIS.packageType, BitfinexEntries)) AS array(L2EntryNew) AS 'BitfinexBook',  
(BinanceBook[level==0 and side == BID].price[0] + BinanceBook[level==0 and side == ASK].price[0]) / 2 AS 'BinancePrice',  
(BitfinexBook[level==0 and side == BID].price[0] + BitfinexBook[level==0 and side == ASK].price[0]) / 2 AS 'BitfinexPrice',  
BinancePrice - BitfinexPrice AS 'Spread'  
SELECT   
BinancePrice, BitfinexPrice, Spread  
FROM ("BITFINEX" UNION "BINANCE")  
over time(100ms)  
WHERE symbol == 'BTC/USDT' and BinanceBook != null and BitfinexBook != null  
```

How can I retrieve the latest best prices for symbols present in two separate streams?
--------------------------------------------------------------------------------------

### Answer

```qql
WITH  
(THIS.entries if symbol == 'BTCUSDT') as 'CashEntries',  
(THIS.entries if symbol == 'BTCPC-T') as 'FutureEntries',  
lastNotNull{}(ORDERBOOK{}(THIS.packageType, CashEntries)) as array(L2EntryNew) as 'CashBook',  
lastNotNull{}(ORDERBOOK{}(THIS.packageType, FutureEntries)) as array(L2EntryNew) as 'FutureBook',  
CashBook[level==0 and side == BID].price[0] as 'CASH',  
FutureBook[level==0 and side == BID].price[0] as 'FUTURE'  
SELECT   
FUTURE, CASH  
FROM ("BINANCE" UNION "BINANCEFUT")  
over time(100ms)  
WHERE symbol IN ('BTCUSDT', 'BTCPC-T') and CashBook != null and FutureBook != null  
```

Is there a windowed standard deviation function available in QQL, equivalent to the Pandas operation: `df['price'].rolling('60s').std()`?
-----------------------------------------------------------------------------------------------------------------------------------------

Yes, use `statWindow` function with `timePeriod` initial parameter:

```qql
SELECT RUNNING statWindow{timePeriod:60s}(volume).standardDeviation  
FROM "1sec.bars"  
WHERE symbol == 'AAPL'  
```

How can I calculate the difference between the current and previous volume values in my bars stream?
----------------------------------------------------------------------------------------------------

Use `window` function with fixed period of size 2:

```qql
WITH  
window{period:2}(volume) as w  
SELECT RUNNING w[1] - w[0]  
FROM "bars"  
WHERE symbol == 'AAPL'  
```

How can I select all TimeBase streams and their types?
------------------------------------------------------

To retrieve a list of all streams along with their associated metadata, utilize the `streams()` function.
Afterwards, you can iterate through the streams using the `ARRAY JOIN` clause to extract the specific information you require.

```qql
SELECT s.key AS key, s.topTypes[not isAbstract].name AS types  
ARRAY JOIN streams() AS s  
```

How do I fetch symbols from a securities stream?
------------------------------------------------

To retrieve symbols from a securities stream, you can use the `symbols()` function in the following manner:

```qql
SELECT s  
ARRAY JOIN symbols('securities') AS s  
```

How can I select all available functions supported by QQL?
----------------------------------------------------------

To obtain a list of all available functions in QQL, you can make use of the `stateless_functions()` and `stateful_functions()` functions, for example:

```qql
SELECT f.id, f.arguments.name, f.arguments.dataType.baseName  
ARRAY JOIN stateless_functions() AS f  
```
