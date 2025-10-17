---
title: Stream Modify
tags: [ddl, modify, stream, alter, lifecycle, schema, rename, comment, options, syntax, confirm, examples]
---

[[SECTION:MODIFY_STREAM_OVERVIEW]]
[[TAGS: MODIFY STREAM OVERVIEW PURPOSE SCHEMA CHANGE]]
The Modify Stream documentation explains how to change an existing stream's schema. The modify statement completely replaces the existing stream schema with the new one. All classes and fields must be specified, even if they are not changing.

[[SECTION:MODIFY_STREAM_SYNTAX]]
[[TAGS: MODIFY STREAM SYNTAX GRAMMAR STRUCTURE]]
Syntax:
MODIFY STREAM stream_name [title]
(class_expr|enum_expr [; ...])
[OPTIONS (identifier [= expr] [; ...])]
[COMMENT 'comment text']
[CONFIRM NO_CONVERSION|CONVERT_DATA|DROP_ATTRIBUTES|DROP_TYPES|DROP_DATA]

[[SECTION:MODIFY_STREAM_CLASS_EXPR]]
[[TAGS: MODIFY STREAM CLASS EXPRESSION SYNTAX]]
CLASS type_name [title] [UNDER type_name]
(static_attribute|attribute [, ...])
[AUXILIARY|NOT AUXILIARY]
[INSTANTIABLE|NOT INSTANTIABLE]
[COMMENT 'comment text']

[[SECTION:MODIFY_STREAM_ENUM_EXPR]]
[[TAGS: MODIFY STREAM ENUM EXPRESSION SYNTAX]]
ENUM enum_name [title]
(identifier [= expr] [, ...])
[FLAGS]
[COMMENT 'comment text']

[[SECTION:MODIFY_STREAM_STATIC_ATTRIBUTE]]
[[TAGS: MODIFY STREAM STATIC ATTRIBUTE SYNTAX]]
STATIC identifier [title] type [NOT NULL] [encoding] [BETWEEN min_expr AND max_expr] = expr
[TAGS (identifier:expr [, ...])]
[COMMENT 'comment text']

[[SECTION:MODIFY_STREAM_ATTRIBUTE]]
[[TAGS: MODIFY STREAM ATTRIBUTE FIELD SYNTAX]]
identifier [title] type [NOT NULL] [encoding] [BETWEEN min_expr AND max_expr] [RELATIVE TO identifier] [DEFAULT expr]
[TAGS (identifier:expr [, ...])]
[COMMENT 'comment text']

[[SECTION:MODIFY_STREAM_OPTIONS]]
[[TAGS: MODIFY STREAM OPTIONS LIST CONFIGURATION]]
Options list (identifier values):
+ `FIXEDTYPE`: (Boolean.) A stream capable of containing messages of a single specified type.
+ `POLYMORPHIC`: (Boolean.) A polymorphic stream is capable of containing messages of several specified types.
+ `LOSSLESS`: (Boolean.) [Lossless](../../../overview/streams#memory-management-for-transient-streams) stream. Durable streams are always lossless.
+ `LOSSY`: (Boolean.) [Lossy](../../../overview/streams#memory-management-for-transient-streams) stream.
+ `HIGHAVAILABILITY`: (Boolean.) High availability durable streams are cached on startup.
+ `PERIODICITY`: (Varchar.) Indicate a known stream periodicity.
+ `DF`: (Numeric.) [Distribution factor](../../../technology/data_architecture#distribution-factor) value.
+ `INITSIZE`: (Numeric.) Initial size of the write buffer in bytes.
+ `MAXSIZE`: (Numeric.) The limit on buffer growth in bytes. Default is 64K.
+ `MAXTIME`: (Numeric.) The limit on buffer growth as difference between first and last message time. Default is Long.MAX_VALUE.
+ `UNIQUE`: (Boolean.) [Unique](../../API%20Documentation/python-ce#unique) value.
+ `STORAGEVERSION`: (Varchar.) Stream format version. Supported versions are '5.0' (TS data file) and '4.3' (Classic).

[[SECTION:MODIFY_STREAM_IDENTIFIER]]
[[TAGS: MODIFY STREAM IDENTIFIER TOKEN NAME]]
An identifier is a token that forms a name.

[[SECTION:MODIFY_STREAM_CONFIRM]]
[[TAGS: MODIFY STREAM CONFIRM MODES DATA CONVERSION RULES]]
CONFIRM modes:
- `NO_CONVERSION`: Fails if data type changes require conversion.
- `CONVERT_DATA`: Allow all conversions.
- `DROP_ATTRIBUTES`: Permit removing fields.
- `DROP_TYPES`: Permit removing types.
- `DROP_DATA`: Allow dropping data not convertible (e.g., VARCHAR→FLOAT incompatible values).

[[SECTION:MODIFY_STREAM_TIPS]]
[[TAGS: MODIFY STREAM TIPS GUIDANCE BEST_PRACTICES]]
Tips:
* Use `UNDER` for inheritance where applicable.
* Classes may include static and/or non-static attributes.
* `AUXILIARY` classes cannot be written directly.
* `NOT INSTANTIABLE` marks abstract classes.
* Use `FLAGS` for bitmask enums.
* `STATIC` attributes require a constant `= expr`.
* Use `BETWEEN ... AND ...` for numeric bounds.
* `RELATIVE TO` declares field decoding dependency.
* `TAGS` attach key:value metadata.
* `COMMENT` adds descriptive text.

[[SECTION:MODIFY_STREAM_EXAMPLES_CREATE_MODIFY]]
[[TAGS: MODIFY STREAM EXAMPLES CREATE MODIFY DURABLE]]
```qql
-- Create a stream named TEST
CREATE DURABLE STREAM TEST (
    CLASS "deltix.timebase.api.messages.MarketMessage" 'Market Message' (
        "currencyCode" 'Currency Code' INTEGER SIGNED (16) COMMENT 'Currency code represented as short',
        "originalTimestamp" 'Original Timestamp' TIMESTAMP COMMENT 'Exchange Time is measured in milliseconds that passed since January 1, 1970 UTC',
        "sequenceNumber" 'Sequence Number' INTEGER COMMENT 'Market specific identifier of the given event in a sequence of market events',
        "sourceId" 'Source Id' VARCHAR ALPHANUMERIC (10) COMMENT 'Identifies market data source' 
    ) AUXILIARY;
      
    CLASS "deltix.timebase.api.messages.BestBidOfferMessage" 'Quote Message' UNDER "deltix.timebase.api.messages.MarketMessage" (
        "offerPrice" 'Offer Price' FLOAT DECIMAL (2),
        "offerSize" 'Offer Size' FLOAT DECIMAL (0),
        "bidPrice" 'Bid Price' FLOAT DECIMAL (2) RELATIVE TO "offerPrice",
        "bidSize" 'Bid Size' FLOAT DECIMAL (0)
    );
    CLASS "deltix.timebase.api.messages.TradeMessage" 'Trade Message' UNDER "deltix.timebase.api.messages.MarketMessage" (
        "price" 'Trade Price' FLOAT DECIMAL (2),
        "size" 'Trade Size' FLOAT DECIMAL (0)
    );
)
OPTIONS (DF = 1; HIGHAVAILABILITY = FALSE)
COMMENT 'QQL is awesome'

-- Modify the TEST stream by adding a new field "exchangeId" to the "BestBidOfferMessage" class
MODIFY STREAM TEST (
    CLASS "deltix.timebase.api.messages.MarketMessage" 'Market Message' (
        "currencyCode" 'Currency Code' INTEGER SIGNED (16) COMMENT 'Currency code represented as short',
        "originalTimestamp" 'Original Timestamp' TIMESTAMP COMMENT 'Exchange Time is measured in milliseconds that passed since January 1, 1970 UTC',
        "sequenceNumber" 'Sequence Number' INTEGER COMMENT 'Market specific identifier of the given event in a sequence of market events',
        "sourceId" 'Source Id' VARCHAR ALPHANUMERIC (10) COMMENT 'Identifies market data source' 
    ) AUXILIARY;
	  
    CLASS "deltix.timebase.api.messages.BestBidOfferMessage" 'Quote Message' UNDER "deltix.timebase.api.messages.MarketMessage" (
        "offerPrice" 'Offer Price' FLOAT DECIMAL (2),
        "offerSize" 'Offer Size' FLOAT DECIMAL (0),
        "bidPrice" 'Bid Price' FLOAT DECIMAL (2) RELATIVE TO "offerPrice",
        "bidSize" 'Bid Size' FLOAT DECIMAL (0)
		"exchangeId" 'Exchange' VARCHAR ALPHANUMERIC (10) COMMENT 'Exchange Code',
    );
    CLASS "deltix.timebase.api.messages.TradeMessage" 'Trade Message' UNDER "deltix.timebase.api.messages.MarketMessage" (
        "price" 'Trade Price' FLOAT DECIMAL (2),
        "size" 'Trade Size' FLOAT DECIMAL (0)
    );
)
OPTIONS (DF = 1; HIGHAVAILABILITY = FALSE)
COMMENT 'QQL is awesome'
```

[[SECTION:MODIFY_STREAM_EXAMPLES_TRANSIENT]]
[[TAGS: MODIFY STREAM EXAMPLES TRANSIENT OPTIONS UNIQUE]]
```qql
-- Create a transient stream with a single class and field
CREATE TRANSIENT STREAM S_TRANSIENT 'AAA' (
    CLASS A (
        F FLOAT DECIMAL (10)
    );
) OPTIONS (unique=true)


-- But the stream schema description has more options due to default values
TRANSIENT STREAM "S_TRANSIENT" 'AAA' (
    CLASS A (
        F FLOAT DECIMAL (10)
    );
)
OPTIONS (POLYMORPHIC; PERIODICITY = 'IRREGULAR'; LOSSY; INITSIZE = 8192; MAXSIZE = 65536; UNIQUE = TRUE)


-- So, to modify the stream and add a new field, you must specify all the options, classes and fields
MODIFY STREAM S_TRANSIENT 'BBB' (
    CLASS A (
        F FLOAT DECIMAL (10),
        F2 FLOAT DECIMAL (10)
    );
) OPTIONS (UNIQUE=true; PERIODICITY = 'STATIC')
CONFIRM DROP_DATA


-- Here's the stream schema after modification
TRANSIENT STREAM "S_TRANSIENT" 'BBB' (
    CLASS A (
        F FLOAT DECIMAL (10),
        F2 FLOAT DECIMAL (10)
    );
)
OPTIONS (POLYMORPHIC; PERIODICITY = 'STATIC'; LOSSY; INITSIZE = 8192; MAXSIZE = 65536; UNIQUE = TRUE)
```

[[SECTION:MODIFY_STREAM_REFERENCE_END]] 
[[TAGS: MODIFY STREAM END REFERENCE]] 
End of modify stream reference.
