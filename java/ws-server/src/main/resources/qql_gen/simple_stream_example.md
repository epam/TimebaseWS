---
title: Simple Stream Example
tags: [ddl, stream, syntax, classes, enums, data_types, options, comment, example]
---

[[SECTION:OVERVIEW]]
[[TAGS: DDL STREAM EXAMPLE INTRO]]
Minimal example of a DURABLE stream with two message classes (BestBidOfferMessage, TradeMessage), field metadata (titles), numeric DECIMAL scaling, a RELATIVE TO reference, OPTIONS, and COMMENT.

[[SECTION:STREAM_DECLARATION]]
[[TAGS: DDL STREAM DECLARATION DURABLE]]
Pattern elements illustrated:
- CREATE DURABLE STREAM
- Parenthesized CLASS blocks separated by semicolons
- OPTIONS clause (implementation‑specific attributes)
- COMMENT for human description

[[SECTION:CLASSES]]
[[TAGS: DDL CLASSES STRUCTURE FIELDS]]
Classes defined:
1. "deltix.timebase.api.messages.BestBidOfferMessage"
   Fields:
    - "offerPrice" FLOAT DECIMAL(2)
    - "offerSize" FLOAT DECIMAL(0)
    - "bidPrice" FLOAT DECIMAL(2) RELATIVE TO "offerPrice"
    - "bidSize" FLOAT DECIMAL(0)
2. "deltix.timebase.api.messages.TradeMessage"
   Fields:
    - "price" FLOAT DECIMAL(2)
    - "size" FLOAT DECIMAL(0)

[[SECTION:FIELD_ATTRIBUTES]]
[[TAGS: DDL FIELDS ATTRIBUTES DECIMAL RELATIVE]]
Attribute notes:
- DECIMAL(precision_scale_hint) shown as DECIMAL (2) or (0) for scale.
- RELATIVE TO establishes logical linkage (e.g., bidPrice relative to offerPrice).
- Titles (single quoted) provide human labels; do not affect schema logic.

[[SECTION:OPTIONS_COMMENT]]
[[TAGS: DDL OPTIONS COMMENT METADATA]]
OPTIONS (DF = 1; HIGHAVAILABILITY = FALSE)
COMMENT 'QQL is awesome'
Included to demonstrate configurable stream properties + descriptive comment.

[[SECTION:FULL_EXAMPLE_DDL]]
[[TAGS: DDL COMPLETE EXAMPLE]]
CREATE DURABLE STREAM "TEST" (
  CLASS "deltix.timebase.api.messages.BestBidOfferMessage" 'Quote Message' (
    "offerPrice" 'Offer Price' FLOAT DECIMAL (2),
    "offerSize"  'Offer Size'  FLOAT DECIMAL (0),
    "bidPrice"   'Bid Price'   FLOAT DECIMAL (2) RELATIVE TO "offerPrice",
    "bidSize"    'Bid Size'    FLOAT DECIMAL (0)
  );
  CLASS "deltix.timebase.api.messages.TradeMessage" 'Trade Message' (
    "price" 'Trade Price' FLOAT DECIMAL (2),
    "size"  'Trade Size'  FLOAT DECIMAL (0)
  )
)
OPTIONS (DF = 1; HIGHAVAILABILITY = FALSE)
COMMENT 'QQL is awesome'

[[SECTION:MINIMAL_VARIANT]] 
[[TAGS: DDL MINIMAL VARIANT]] 
Minimal form (omits titles, OPTIONS, COMMENT):
CREATE DURABLE STREAM "TEST_MIN" (
    CLASS "deltix.timebase.api.messages.BestBidOfferMessage" (
        "offerPrice" FLOAT DECIMAL (2),
        "offerSize"  FLOAT DECIMAL (0),
        "bidPrice"   FLOAT DECIMAL (2) RELATIVE TO "offerPrice",
        "bidSize"    FLOAT DECIMAL (0)
    );
    CLASS "deltix.timebase.api.messages.TradeMessage" (
        "price" FLOAT DECIMAL (2),
        "size"  FLOAT DECIMAL (0)
    )
)

[[SECTION:BEST_PRACTICES]] 
[[TAGS: DDL PRACTICES GUIDELINES]]
1. Quote all stream, class, field identifiers.
2. Use RELATIVE TO sparingly—only when semantic linkage exists.
3. Omit OPTIONS unless required.
4. Keep a minimal alternate version for quick reference.

[[SECTION:REFERENCE_END]] 
[[TAGS: DDL END EXAMPLE]] 
End of simple stream example reference.