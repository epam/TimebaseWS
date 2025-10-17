---
title: Complex Stream Example
tags: [ddl, stream, complex, example, coinbase, marketdata, classes, enums, inheritance, array, polymorphism, best_practices, migration]
---

[[SECTION:COMPLEX_STREAM_OVERVIEW]]
[[TAGS: STREAM EXAMPLE OVERVIEW COINBASE POLYMORPHIC]]
Illustrative large polymorphic market data stream (Coinbase style). Demonstrates:
1. Deep inheritance chain (Base → Specialized).
2. Multiple ENUM domains.
3. Package header pattern with polymorphic entries array.
4. Auxiliary classes to factor shared fields.

[[SECTION:COMPLEX_STREAM_STRUCTURE]]
[[TAGS: STREAM STRUCTURE CLASSES ENUMS INHERITANCE]]
Components:
- Base market message class (AUXILIARY).
- ENUM types for package, quote side, book actions, aggressor side, trade type, data model type, connector status, security status.
- Hierarchy for L1 / L2 / Trade / Book reset entries.
- Package header with ARRAY of polymorphic entry OBJECTs.
- Operational / status message classes.

[[SECTION:COMPLEX_STREAM_FIELD_RULES]]
[[TAGS: FIELDS ORDER NOT_NULL ENCODING]]
Field order rule: name TYPE [NOT NULL] [encoding...]
Examples:
currencyCode INTEGER SIGNED(16)
sourceId VARCHAR ALPHANUMERIC(10)
packageType deltix.timebase.api.messages.universal.PackageType NOT NULL

[[SECTION:COMPLEX_STREAM_DDL]]
[[TAGS: STREAM DDL FULL EXAMPLE]]
CREATE DURABLE STREAM "coinbase" (
    CLASS "deltix.timebase.api.messages.MarketMessage" (
        currencyCode INTEGER SIGNED(16),
        originalTimestamp TIMESTAMP,
        sequenceNumber INTEGER,
        sourceId VARCHAR ALPHANUMERIC(10)
    ) AUXILIARY;

    ENUM "deltix.timebase.api.messages.universal.PackageType" (
        VENDOR_SNAPSHOT = 0,
        PERIODICAL_SNAPSHOT = 1,
        INCREMENTAL_UPDATE = 2
    );

    CLASS "deltix.timebase.api.messages.universal.PackageHeader" UNDER "deltix.timebase.api.messages.MarketMessage" (
        packageType deltix.timebase.api.messages.universal.PackageType NOT NULL
    ) AUXILIARY;

    CLASS "deltix.timebase.api.messages.universal.BaseEntry" (
        contractId VARCHAR ALPHANUMERIC(10),
        exchangeId VARCHAR ALPHANUMERIC(10),
        isImplied BOOLEAN
    ) AUXILIARY;

    CLASS "deltix.timebase.api.messages.universal.BasePriceEntry" UNDER "deltix.timebase.api.messages.universal.BaseEntry" (
        numberOfOrders INTEGER,
        participantId VARCHAR,
        price FLOAT DECIMAL64,
        quoteId VARCHAR,
        size FLOAT DECIMAL64
    ) AUXILIARY;

    ENUM "deltix.timebase.api.messages.QuoteSide" (BID = 0, ASK = 1);

    CLASS "deltix.timebase.api.messages.universal.L1Entry" UNDER "deltix.timebase.api.messages.universal.BasePriceEntry" (
        isNational BOOLEAN,
        side deltix.timebase.api.messages.QuoteSide NOT NULL
    ) AUXILIARY;

    CLASS "deltix.timebase.api.messages.universal.L2EntryNew" UNDER "deltix.timebase.api.messages.universal.BasePriceEntry" (
        level INTEGER NOT NULL SIGNED(16),
        side deltix.timebase.api.messages.QuoteSide NOT NULL
    ) AUXILIARY;

    ENUM "deltix.timebase.api.messages.BookUpdateAction" (INSERT = 0, UPDATE = 1, DELETE = 2);

    CLASS "deltix.timebase.api.messages.universal.L2EntryUpdate" UNDER "deltix.timebase.api.messages.universal.BasePriceEntry" (
        action deltix.timebase.api.messages.BookUpdateAction NOT NULL,
        level INTEGER NOT NULL SIGNED(16),
        side deltix.timebase.api.messages.QuoteSide
    ) AUXILIARY;

    ENUM "deltix.timebase.api.messages.AggressorSide" (BUY = 0, SELL = 1);

    ENUM "deltix.timebase.api.messages.TradeType" (
        REGULAR_TRADE = 0,
        AUCTION_CLEARING_PRICE = 1,
        CORRECTION = 2,
        CANCELLATION = 3,
        UNKNOWN = 4
    );

    CLASS "deltix.timebase.api.messages.universal.TradeEntry" UNDER "deltix.timebase.api.messages.universal.BaseEntry" (
        buyerNumberOfOrders INTEGER,
        buyerOrderId VARCHAR,
        buyerParticipantId VARCHAR,
        condition VARCHAR,
        matchId VARCHAR,
        price FLOAT DECIMAL64,
        sellerNumberOfOrders INTEGER,
        sellerOrderId VARCHAR,
        sellerParticipantId VARCHAR,
        side deltix.timebase.api.messages.AggressorSide,
        size FLOAT DECIMAL64,
        tradeType deltix.timebase.api.messages.TradeType
    ) AUXILIARY;

    ENUM "deltix.timebase.api.messages.DataModelType" (
        LEVEL_ONE = 0,
        LEVEL_TWO = 1,
        LEVEL_THREE = 2,
        MAX = 3
    );

    CLASS "deltix.timebase.api.messages.universal.BookResetEntry" UNDER "deltix.timebase.api.messages.universal.BaseEntry" (
        modelType deltix.timebase.api.messages.DataModelType NOT NULL,
        side deltix.timebase.api.messages.QuoteSide
    ) AUXILIARY;

    CLASS "deltix.qsrv.hf.plugins.data.coinbase.types.CoinbasePackageHeader" UNDER "deltix.timebase.api.messages.universal.PackageHeader" (
        entries ARRAY(
            OBJECT(
                deltix.timebase.api.messages.universal.L1Entry,
                deltix.timebase.api.messages.universal.L2EntryNew,
                deltix.timebase.api.messages.universal.L2EntryUpdate,
                deltix.timebase.api.messages.universal.TradeEntry,
                deltix.timebase.api.messages.universal.BookResetEntry
            )
        )
    ) AUXILIARY;

    ENUM "deltix.timebase.api.messages.service.DataConnectorStatus" (
        INITIAL = 0,
        CONNECTED_BY_USER = 1,
        AUTOMATICALLY_RESTORED = 2,
        DISCONNECTED_BY_USER = 3,
        DISCONNECTED_BY_COMPLETED_BATCH = 4,
        DISCONNECTED_BY_VENDOR_AND_RECONNECTING = 5,
        DISCONNECTED_BY_VENDOR_AND_HALTED = 6,
        DISCONNECTED_BY_ERROR_AND_RECONNECTING = 7,
        DISCONNECTED_BY_ERROR_AND_HALTED = 8,
        RECOVERING_BEGIN = 9,
        LIVE_BEGIN = 10
    );

    CLASS "deltix.timebase.api.messages.service.ConnectionStatusChangeMessage" (
        cause VARCHAR,
        status deltix.timebase.api.messages.service.DataConnectorStatus
    );

    ENUM "deltix.timebase.api.messages.status.SecurityStatus" (
        FEED_CONNECTED = 0,
        FEED_DISCONNECTED = 1,
        TRADING_STARTED = 2,
        TRADING_STOPPED = 3
    );

    CLASS "deltix.timebase.api.messages.status.SecurityStatusMessage" UNDER "deltix.timebase.api.messages.MarketMessage" (
        status deltix.timebase.api.messages.status.SecurityStatus,
        reason VARCHAR
    )
) COMMENT 'coinbase'

[[SECTION:COMPLEX_STREAM_POLYMORPHIC_ARRAY]]
[[TAGS: POLYMORPHIC ARRAY ENTRIES PACKAGE L2]]
entries ARRAY(OBJECT(...)) holds heterogeneous book / trade entries inside a package header. Consumers narrow via object cast or filter by TYPE/side fields after flattening (e.g., ARRAY JOIN).

[[SECTION:COMPLEX_STREAM_BEST_PRACTICES]]
[[TAGS: BEST_PRACTICES COMPLEX STREAM DESIGN]]
1. Factor repeated price/size fields into BasePriceEntry (already done).
2. Keep ENUM sets tightly scoped; avoid overloading generic status enums.
3. Use AUXILIARY for structural or nested-only message types.
4. Limit ARRAY polymorphism breadth to necessary concrete types.
5. Document packageType semantics externally if value proliferation occurs.

[[SECTION:COMPLEX_STREAM_ANTI_PATTERNS]]
[[TAGS: ANTI_PATTERNS COMPLEX STREAM]]
Avoid:
1. Marking rarely present fields NOT NULL.
2. Expanding entries polymorphic list with speculative future types.
3. Overusing deep inheritance for single-field differences.
4. Duplicating enum meanings across multiple separate enums.
5. Adding redundant size/price aliases instead of reusing inherited fields.

[[SECTION:COMPLEX_STREAM_MIGRATION]]
[[TAGS: MIGRATION EVOLUTION CHANGES]]
Typical changes:
1. Add nullable field to leaf class → backward compatible.
2. Introduce new entry type in entries ARRAY → ensure downstream filters updated.
3. Tighten nullable → NOT NULL → breaking unless data guarantee proven.
4. Replace enum values → add new value first; deprecate old after clients adapt.
5. Split monolithic BasePriceEntry if divergent semantics emerge → staged (add new base, migrate children).

[[SECTION:COMPLEX_STREAM_REFERENCE_END]]
[[TAGS: END REFERENCE COMPLEX STREAM]]
End of complex stream example reference.
