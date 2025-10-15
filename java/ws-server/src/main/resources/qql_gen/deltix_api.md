---
title: Deltix API Classes
tags: [ddl, stream, syntax, classes, enums, data types, deltix api, financial domain, package headers, market data, order book, l1, l2, l3, trade entry, best bid, universal format]
---

# Deltix API 

This section describes commonly used Deltix API classes.
They can be used as base classes for your messages in the financial domain.
When using them don't forget to include all dependent classes and enums in your DDL.

```qql
CLASS "deltix.timebase.api.messages.MarketMessage" 'Market Message' (
    "currencyCode" 'Currency Code' INTEGER SIGNED (16) COMMENT 'Currency code represented as short. Use {currencyCodec} or\n{link #setCurrencyCode} and {link #getCurrencyCode} to\nconvert this value to a three-character code.',
    "originalTimestamp" 'Original Timestamp' TIMESTAMP COMMENT 'Exchange Time is measured in milliseconds that passed since January 1, 1970 UTC',
    "sequenceNumber" 'Sequence Number' INTEGER COMMENT 'Market specific identifier of the given event in a sequence of market events.',
    "sourceId" 'Source Id' VARCHAR ALPHANUMERIC (10) COMMENT 'Identifies market data source. Different sessions of same connector\nto a same data provider should have different id.'
) AUXILIARY COMMENT 'Most financial market-related messages subclass this abstract class.';

ENUM "deltix.timebase.api.messages.universal.PackageType" 'Package Type' (
    "VENDOR_SNAPSHOT" = 0,
    "PERIODICAL_SNAPSHOT" = 1,
    "INCREMENTAL_UPDATE" = 2
);

CLASS "deltix.timebase.api.messages.universal.PackageHeader" 'Package Header' UNDER "deltix.timebase.api.messages.MarketMessage" (
    "entries" 'Entries' ARRAY(OBJECT("deltix.timebase.api.messages.universal.TradeEntry", "deltix.timebase.api.messages.universal.L1Entry", "deltix.timebase.api.messages.universal.L2EntryNew", "deltix.timebase.api.messages.universal.L2EntryUpdate", "deltix.timebase.api.messages.universal.L3EntryNew", "deltix.timebase.api.messages.universal.L3EntryUpdate", "deltix.timebase.api.messages.universal.BookResetEntry", "deltix.timebase.api.messages.universal.StatisticsEntry") NOT NULL) NOT NULL COMMENT 'Message package content. Array of individual entries.\nTypical entries classes are L1Entry, L2Entry, L3Entry, TradeEntry.',
    "packageType" 'Package Type' "deltix.timebase.api.messages.universal.PackageType" NOT NULL COMMENT 'Package type needs to distinguish between incremental changes and different types of snapshot.'
) COMMENT 'Represents market data package.';
```

```qql
CLASS "deltix.timebase.api.messages.universal.BaseEntry" 'Base Entry' (
    "contractId" 'Contract ID' VARCHAR ALPHANUMERIC (10) COMMENT 'Special field designed to store multiple derivative instruments\' updates\ninto single package. Most of the time should be static null.',
    "exchangeId" 'Exchange Code' VARCHAR ALPHANUMERIC (10) COMMENT 'Exchange code compressed to long using ALPHANUMERIC(10) encoding.\nsee #getExchange()',
    "isImplied" 'Is Implied' BOOLEAN COMMENT 'True, if quote (or trade) comes from an implied Order book.'
) AUXILIARY COMMENT 'Base class for market data entry to be included in package (PackageHeader).';

CLASS "deltix.timebase.api.messages.universal.BasePriceEntry" 'Base Price Entry' UNDER "deltix.timebase.api.messages.universal.BaseEntry" (
    "numberOfOrders" 'Number Of Orders' INTEGER COMMENT 'Numbers of orders.',
    "participantId" 'Participant' VARCHAR COMMENT 'Id of participant (or broker ID).',
    "price" 'Price' FLOAT DECIMAL64 COMMENT 'Ask, Bid or Trade price.',
    "quoteId" 'Quote ID' VARCHAR COMMENT 'Quote ID. In Forex market, for example, quote ID can be referenced in\nTradeOrders (to identify market maker\'s quote/rate we want to deal with).\nEach market maker usually keeps this ID unique per session per day. This\nis a alpha-numeric text text field that can reach 64 characters or more,',
    "size" 'Size' FLOAT DECIMAL64 COMMENT 'Ask, Bid or Trade quantity.'
) AUXILIARY COMMENT 'This is base class for price entry.';

CLASS "deltix.timebase.api.messages.universal.BookResetEntry" 'Book Reset Entry' UNDER "deltix.timebase.api.messages.universal.BaseEntry" (
    "modelType" 'Model Type' "deltix.timebase.api.messages.DataModelType" NOT NULL COMMENT 'Data Model Type to identify what book we should reset.'
);

ENUM "deltix.timebase.api.messages.universal.InsertType" 'Insert Type' (
    "ADD_BACK" = 0,
    "ADD_FRONT" = 1,
    "ADD_BEFORE" = 2
);

CLASS "deltix.timebase.api.messages.universal.L1Entry" 'L1Entry' UNDER "deltix.timebase.api.messages.universal.BasePriceEntry" (
    "isNational" 'Is National' BOOLEAN COMMENT 'return <code>1</code> if this BBO quote represents the national best, <code>0</code> if this BBO is regional\nand <code>BooleanDataType.NULL</code> if the property is undefined. In case of NBBO you can inspect {#getExchangeId()}\nto see what exchange/ECN has the national best price.',
    "side" 'Side' "deltix.timebase.api.messages.QuoteSide" NOT NULL COMMENT 'Quote side. Bid or Ask.\nAsk = Sell limit order.\nBid = Buy limit  order.'
);

CLASS "deltix.timebase.api.messages.universal.L2EntryNew" 'L2EntryNew' UNDER "deltix.timebase.api.messages.universal.BasePriceEntry" (
    "level" 'Level Index' INTEGER NOT NULL SIGNED (16) COMMENT 'Market Depth  / Price Level.\nThis value is zero-based (top of the book will have depth=0).',
    "side" 'Side' "deltix.timebase.api.messages.QuoteSide" NOT NULL COMMENT 'Quote side. Bid or Ask.\nAsk = Sell limit order.\nBid = Buy limit  order.'
);

CLASS "deltix.timebase.api.messages.universal.L2EntryUpdate" 'L2EntryUpdate' UNDER "deltix.timebase.api.messages.universal.BasePriceEntry" (
    "action" 'Action' "deltix.timebase.api.messages.BookUpdateAction" NOT NULL COMMENT 'Directs how to update an Order Book\n<p>\n<b>symbol, instrumentType, exchangeCode, marketMakerCode, depth</b> fields constitute the composite key\nto identify the Order Book record.\n</p>.',
    "level" 'Level Index' INTEGER NOT NULL SIGNED (16) COMMENT 'Market Depth  / Price Level.\nThis value is zero-based (top of the book will have depth=0).',
    "side" 'Side' "deltix.timebase.api.messages.QuoteSide" COMMENT 'Quote side. Bid or Ask.\nAsk = Sell limit order.\nBid = Buy limit  order.'
);

CLASS "deltix.timebase.api.messages.universal.L3EntryNew" 'L3EntryNew' UNDER "deltix.timebase.api.messages.universal.BasePriceEntry" (
    "insertBeforeQuoteId" 'Insert Before Quote Id' VARCHAR MULTILINE COMMENT 'In case of InsertType = ADD_BEFORE represents the id of the quote that should be after inserted.',
    "insertType" 'Insert Type' "deltix.timebase.api.messages.universal.InsertType" COMMENT 'Insert type. Add front or Add back.',
    "side" 'Side' "deltix.timebase.api.messages.QuoteSide" NOT NULL COMMENT 'Quote side. Bid or Ask.\nAsk = Sell limit order.\nBid = Buy limit  order.'
);

CLASS "deltix.timebase.api.messages.universal.L3EntryUpdate" 'L3 Entry Update' UNDER "deltix.timebase.api.messages.universal.BasePriceEntry" (
    "action" 'Action' "deltix.timebase.api.messages.QuoteUpdateAction" NOT NULL COMMENT 'Directs how to update an Order Book\n<p>\n<b>symbol, instrumentType, exchangeCode, quoteId</b> fields constitute the composite key\nto identify the Order Book record.\n</p>.',
    "side" 'Side' "deltix.timebase.api.messages.QuoteSide" COMMENT 'Quote side. Bid or Ask.\nAsk = Sell limit order.\nBid = Buy limit  order.'
);

ENUM "deltix.timebase.api.messages.TradeType" (
    "REGULAR_TRADE" = 0,
    "AUCTION_CLEARING_PRICE" = 1,
    "CORRECTION" = 2,
    "CANCELLATION" = 3,
    "UNKNOWN" = 4
);

CLASS "deltix.timebase.api.messages.universal.TradeEntry" 'Trade Entry' UNDER "deltix.timebase.api.messages.universal.BaseEntry" (
    "buyerNumberOfOrders" 'Buyer Number Of Orders' INTEGER COMMENT 'Buyer number of orders involved in match.',
    "buyerOrderId" 'Buyer Order ID' VARCHAR COMMENT 'ID of buyer order.',
    "buyerParticipantId" 'Buyer Participant ID' VARCHAR COMMENT 'Buyer participant ID (or broker ID) for trader that submit buying order.',
    "condition" 'Condition' VARCHAR COMMENT 'Market specific trade condition.',
    "matchId" 'Match ID' VARCHAR COMMENT 'Id of particular execution event (ExecutionId, TradeId, MatchId)',
    "price" 'Price' FLOAT DECIMAL64 COMMENT 'Ask, Bid or Trade price.',
    "sellerNumberOfOrders" 'Seller Number Of Orders' INTEGER COMMENT 'Seller number of orders involved in match.',
    "sellerOrderId" 'Seller Order ID' VARCHAR COMMENT 'ID of seller order.',
    "sellerParticipantId" 'Seller Participant ID' VARCHAR COMMENT 'Seller participant ID (or broker ID) for trader that submit selling order.',
    "side" 'Side' "deltix.timebase.api.messages.AggressorSide" COMMENT 'Trade side. Sell or Buy.\nFor Trade it\'s aggressor side, i.e. side from where market order has came.',
    "size" 'Size' FLOAT DECIMAL64 COMMENT 'Ask, Bid or Trade quantity.',
    "tradeType" 'Trade Type' "deltix.timebase.api.messages.TradeType" COMMENT 'Explains the meaning of the given price and/or size.\nThe value is null for regular trades.'
) AUXILIARY COMMENT 'Basic information about a market trade.';
```

```qql
CLASS "deltix.timebase.api.messages.BestBidOfferMessage" 'Best Bid Offer Message' UNDER "deltix.timebase.api.messages.MarketMessage" (
    STATIC "isNational" 'National BBO' BOOLEAN = true,
    "bidPrice" 'Bid Price' FLOAT DECIMAL,
    "bidSize" 'Bid Size' FLOAT DECIMAL,
    "bidExchangeId" 'Bid Exchange' VARCHAR ALPHANUMERIC (10),
    "offerPrice" 'Offer Price' FLOAT DECIMAL,
    "offerSize" 'Offer Size' FLOAT DECIMAL,
    "offerExchangeId" 'Offer Exchange' VARCHAR ALPHANUMERIC (10),
    STATIC "bidNumOfOrders" 'Bid Num Of Orders' INTEGER SIGNED (32) = NULL,
    STATIC "bidQuoteId" 'Bid Quote Id' BINARY = NULL,
    STATIC "offerNumOfOrders" 'Offer Num Of Orders' INTEGER SIGNED (32) = NULL,
    STATIC "offerQuoteId" 'Offer Quote Id' BINARY = NULL
);
```

```qql
ENUM "deltix.timebase.api.messages.AggressorSide" 'Aggressor Side' (
    "BUY" = 0,
    "SELL" = 1
);
ENUM "deltix.timebase.api.messages.MarketEventType" 'Market Event Type' (
    "BID" = 0,
    "OFFER" = 1,
    "TRADE" = 2,
    "INDEX_VALUE" = 3,
    "OPENING_PRICE" = 4,
    "CLOSING_PRICE" = 5,
    "SETTLEMENT_PRICE" = 6,
    "TRADING_SESSION_HIGH_PRICE" = 7,
    "TRADING_SESSION_LOW_PRICE" = 8,
    "TRADING_SESSION_VWAP_PRICE" = 9,
    "IMBALANCE" = 10,
    "TRADE_VOLUME" = 11,
    "OPEN_INTEREST" = 12,
    "COMPOSITE_UNDERLYING_PRICE" = 13,
    "SIMULATED_SELL_PRICE" = 14,
    "SIMULATED_BUY_PRICE" = 15,
    "MARGIN_RATE" = 16,
    "MID_PRICE" = 17,
    "EMPTY_BOOK" = 18,
    "SETTLE_HIGH_PRICE" = 19,
    "SETTLE_LOW_PRICE" = 20,
    "PRIOR_SETTLE_PRICE" = 21,
    "SESSION_HIGH_BID" = 22,
    "SESSION_LOW_OFFER" = 23,
    "EARLY_PRICE" = 24,
    "AUCTION_CLEARING_PRICE" = 25,
    "SWAP_VALUE_FACTOR" = 26,
    "VALUE_ADJ_LONG" = 27,
    "CUMMULATIVE_VALUE_ADJ_LONG" = 28,
    "DAILY_VALUE_ADJ_SHORT" = 29,
    "CUMMULATIVE_VALUE_ADJ_SHORT" = 30,
    "FIXING_PRICE" = 31,
    "CASH_RATE" = 32,
    "RECOVERY_RATE" = 33,
    "RECOVERY_RATE_LONG" = 34,
    "RECOVERY_RATE_SHORT" = 35
);

CLASS "deltix.timebase.api.messages.TradeMessage" 'Trade Message' UNDER "deltix.timebase.api.messages.MarketMessage" (
    "exchangeId" 'Exchange Code' VARCHAR ALPHANUMERIC (10),
    "price" 'Price' FLOAT DECIMAL,
    "size" 'Size' FLOAT DECIMAL,
    "condition" 'Trade Condition' VARCHAR MULTILINE,
    "aggressorSide" 'Aggressor Side' "deltix.timebase.api.messages.AggressorSide",
    "beginMatch" 'Begin Match' BOOLEAN,
    "netPriceChange" 'Net Price Change' FLOAT DECIMAL,
    "eventType" 'Event Type' "deltix.timebase.api.messages.MarketEventType"
);

CLASS "deltix.timebase.api.messages.BarMessage" 'Bar Message' UNDER "deltix.timebase.api.messages.MarketMessage" (
    "exchangeId" 'Exchange Code' VARCHAR ALPHANUMERIC (10),
    "close" 'Close' FLOAT DECIMAL,
    "open" 'Open' FLOAT DECIMAL RELATIVE TO "close",
    "high" 'High' FLOAT DECIMAL RELATIVE TO "close",
    "low" 'Low' FLOAT DECIMAL RELATIVE TO "close",
    "volume" 'Volume' FLOAT DECIMAL
);
```
