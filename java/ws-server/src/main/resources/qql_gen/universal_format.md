---
title: Universal Format
tags: [qql, ddl, data types, universal, format, l1, l2, l3, order book, market data, financial, example]
---

# Universal format

The following sections describe relations between these classes

## Introduction

System components may consume market data with different level of granularity from external vendors. All market data is then stored in TimeBase - Deltix proprietary time-series database. In TimeBase, all data is organized in streams in a form of chronologically arranged messages. In object-oriented programing languages messages can be seen as classes, each with a specific set of fields. To be able to consume market data of any depth and granularity and map it on the TimeBase data model, we developed an API that includes classes that represent L1, L2, and even L3 market data, which can be then used for Order Book construction.

## Model Types

Received market data is organized in so-called Packages. `PackageHeader` class represents a package of any type of data. It includes fields that describe a message type and a message body:

* **Message type** is represented by the PackageType: `Deltix.Timebase.Api.Messages.Universal.PackageType` in .NET and `deltix.timebase.api.messages.universal.PackageType` in JAVA.
* **Package type** can be one of the values of the enumeration `PackageType`:
    - `INCREMENTAL_UPDATE`: updates the market data snapshot received from the vendor.
    - `PERIODICAL_SNAPSHOT`: runtime market data snapshot collected by the data connector.
    - `VENDOR_SNAPSHOT`: marked data snapshots received directly from the vendor.

This is important to differentiate between snapshots. `PERIODICAL_SNAPSHOT` listens to `VENDOR_SNAPSHOT` and `INCREMENTAL_UPDATE` and keeps the actual state of the Order Book. It does not provide a state change and contains data to initialize the state for new subscribers or to initialize backtesting starting from a particular state. `PERIODICAL_SNAPSHOT` may be skipped, whereas `VENDOR_SNAPSHOT` must be processed in one way or another. `INCREMENTAL_UPDATE` contains state changes sent by the vendor or as per any application request (for example, because of possible error in the current state).

Message body is represented by Entries objects, which can be one of the following types:

* [L1](#l1-best-bid-offer) represents both exchange-local top of the book (BBO) as well as National Best Bid Offer (NBBO).
* [L2](#l2-market-by-level): (e.g. FIX IncrementalRefresh/FullRefresh, CME.SBE, FAST, etc). L2 (market by level) market data snapshot provides an aggregated Order Book by price levels.
* [L3](#l2-market-by-order): (like MBO.FIX, NASDAQ ITCH, BATS.PITCH). L3 (market by order) market data snapshot provides a detailed view into the full depth of the Order Book, individual orders size and position at every price level.
* TradeEntry: Basic information about market trades, not specific to any granularity level. TradeEntry can be sent within L1, L2 or L3.
* BookResetEntry: It is used by the market data vendor to drop the state of a particular Order Book.

Entries have the following hierarchy:

You can use any of these types of Entries s an input data to build your Order Book. It can serve as BBO aggregator, work with Level2 data or Level3 data. You can mix different Entries and different exchanges in one Package. But it is not allowed to send snapshots for multiple exchanges within the same Package. We are not supporting snapshot and increment messages mixed in one package. For example, there should not be updates or trades in the same message that contains increments. However, trades can be easily combined with increments.
If `BookResetEntry` was received, then we are waiting for snapshots and not increments.
Snapshot includes the entire state of the book for a particular exchange.

## L1 - Best Bid Offer

L1 level of market data granularity may represent both exchange-local top of the book (BBO) as well as National Best Bid Offer (NBBO). This is always a one side quote. The unique key for such data entry is a combination of symbol, exchange and side fields. The following entries can be sent within this level of granularity:

* `L1Entry`
* `TradeEntry`

## L2 - Market by Level

L2 level of market data granularity describes a set of active limit orders for a certain instrument maintained by exchange. It includes prices and sizes of bids and offers, number of orders on every price level.
The key for such data is symbol, exchange, side and **level index**. This means that there is a unique price entry for such combination of fields.
L2-updates insert, delete or update particular lines in the Order Book either on ask or bid side. It also can encode L2-snapshot entry. **Snapshot** is a message which reports the full Order Book state (snapshot) at once. Note L2 is price level-oriented depth-of-the-book format and should be used whenever price or integer index is used to locate Order Book changes. If incremental changes key is a **quoteId**, L3Entry should be used instead.
The following entries are supported in L2:

* `L2EntryNew`
* `L2EntryUpdate`
* `TradeEntry`

We use the following numbering of the price levels - best bid and best ask attributed to 0 level, the next prices are at the level 1 and so on. When a new limit order comes in, it will be placed in the corresponding Order Book level according to its price.
It is possible to pass data to the Order Book with fixed or non-fixed Market Depth. **Market Depth** is the number of price Levels in the Order Book. It is specified by Level2 data provider or the exchange itself. Hence, it could be different for different data providers. By design, it is considered that the depth is provided by means of other data messages, or even using some other approach.
If the Order Book has a fixed depth, Market Depth is to be provided, or, alternatively, the data provider should send deletes to higher levels if this is the convention. Setting up the correct value of a Market Depth is important when creating an Order Book. Failure to do so results in an incorrect simulation:

* If user specifies the Market Depth that is greater than the real one, Order Book can hold outdated orders.
* If user specifies the Market Depth that is smaller than the real one, Order Book can lose new orders.

Levels on top of the Market Depth will be dropped. For example if Market Depth is 10 and one more level is added before 10th, 10th level will be dropped. If DELETE happens after that, the Order Book will have only 9 price levels.

## L3 - Market by Order

L3 format is designed to represent an Order Book as a set of individual quotes for each price level.
The key of the data entry is symbol, exchange, side and **quote id**.
The orders are sorted by price, and quotes within one price level form a queue (if a particular exchange operates with orders priority).
L3-updates: new, cancel, modify and replace of one quote in Order Book either on ask or bid side. It can also encode L3-snapshot entry. Note, L3 is a quote-oriented depth-of-the-book format and should be used whenever **quoteId** is used to locate the Order Book changes.

The following entries can be sent within this level of granularity:

* `L3EntryNew`
* `L3EntryUpdate`
* `TradeEntry`

If `TradeEntry` is sent in L3 format (with `buyerOrderId` or `sellerOrderId` depending on `AgressiveSide`), sending such `TradeEntry` decreases order size with id equal to buyer or seller id.

# Universal format in QQL
Typically, TimeBase streams with "PackageHeader" messages contain data in Universal format.
That means that to extract current best bid and best ask from such streams it's necessary to apply ORDERBOOK function to the stream,
and extract that data from the resulting orderbook object.

Example of QQL query to get best bid and best ask from BITFINEX stream:
```qql
WITH  
OrderBook{}(this.packageType, this.entries) as 'book',
book[level==0 and side == BID].price[0] as 'bestBid',  
book[level==0 and side == ASK].price[0] as 'bestAsk'
SELECT  
bestBid, bestAsk  
FROM BITFINEX  
OVER TIME (10s)  
WHERE symbol == 'BTC/USDT'
```
