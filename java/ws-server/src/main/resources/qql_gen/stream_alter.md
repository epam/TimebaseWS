---
title: Alter Stream
tags: [ddl, alter, stream, incremental, hierarchy, class, enum, attribute, add, drop, rewrite, field, schema, evolution, examples, best_practices, errors]
---

[[SECTION:ALTER_OVERVIEW]]
[[TAGS: ALTER STREAM OVERVIEW PURPOSE INCREMENTAL]]
`ALTER STREAM` performs *incremental* schema evolution (unlike `MODIFY STREAM`, which replaces the entire schema).  
Layered hierarchy of alteration:
1. STREAM (top)
2. CLASS / ENUM (middle)
3. Attribute (FIELDS inside CLASS, values inside ENUM)

Rule: To modify a lower level, all enclosing higher levels must be explicitly present in the `ALTER STREAM` statement.

[[SECTION:HIERARCHY]]
[[TAGS: ALTER HIERARCHY LEVELS LAYERS STRUCTURE]]
Hierarchy & allowed operation scopes:
- Stream Level: `ALTER STREAM name ( ... )`
- Class / Enum Level Ops (inside parentheses):
    - CLASS: `ADD CLASS`, `ALTER CLASS`, `DROP CLASS`, `REWRITE CLASS`
    - ENUM:  `ADD ENUM`,  `ALTER ENUM`,  `DROP ENUM`,  `REWRITE ENUM`
- Attribute Level (only inside `ALTER CLASS` ... field ops block):
    - `ADD FIELD`
    - `ALTER FIELD`
    - `DROP FIELD`
    - `REWRITE FIELD`
- Enum Value Level (only inside `ALTER ENUM`):
    - `ADD`
    - `ALTER`
    - `DROP`
    - (Full replacement done via `REWRITE ENUM`)

[[SECTION:OPERATION_SEMANTICS]]
[[TAGS: ALTER OPERATIONS ADD DROP REWRITE MEANING]]
Semantics:
- ADD: Introduce a new element (class, enum, field, enum value). Fields normally nullable unless declared `NOT NULL`.
- ALTER: Targeted change (type, nullability, encoding, default, metadata).
- DROP: Remove the element (may require confirm flags externally, if enforced).
- REWRITE: Full re-specification; previous definition for that element is replaced; unspecified properties/values are discarded.

[[SECTION:STREAM_LEVEL_SYNTAX]]
[[TAGS: ALTER STREAM SYNTAX TOP]]
Pattern:
ALTER STREAM "streamName"
(
    class_or_enum_operation[; ...]
)
[SET stream_option_name [=] value [, SET ...]]
[CONFIRM NO_CONVERSION|CONVERT_DATA|DROP_ATTRIBUTES|DROP_TYPES|DROP_DATA]

At least one class_or_enum_operation or at least one stream option change required.

[[SECTION:CLASS_ENUM_OPS_SYNTAX]]
[[TAGS: ALTER CLASS ENUM SYNTAX OPERATIONS]]
Class / Enum operations (inside the parentheses list):

ADD CLASS "Name" ['class title'] [UNDER "ParentName"] (
    fieldDecl[, ...]
) 
[AUXILIARY|NOT AUXILIARY] 
[INSTANTIABLE|NOT INSTANTIABLE] 
[COMMENT 'text']

ALTER CLASS "Name" (
    class_field_operation[; ...]
)
[SET class_option_name [=] value [, SET ...]]
[RESOLVE identifier DEFAULT expr]

DROP CLASS "Name"

REWRITE CLASS "Name" ['class title'] [UNDER "ParentName"] (
    fieldDecl[, ...]
) 
[AUXILIARY|NOT AUXILIARY] 
[INSTANTIABLE|NOT INSTANTIABLE] 
[COMMENT 'text']

ADD ENUM "EnumName" ['enum title'] (
    "A" = 0, "B" = 1, "C" = 2
) 
[FLAGS] 
[COMMENT 'text']

ALTER ENUM "EnumName" (
    enum_value_operation[; ...]
)

DROP ENUM "EnumName"

REWRITE ENUM "EnumName" ['enum title'] (
    "A" = 0, "B" = 10, "D" = 11
)
[FLAGS] 
[COMMENT 'text']

[[SECTION:ATTRIBUTE_OPS_SYNTAX]]
[[TAGS: ALTER FIELD ATTRIBUTE SYNTAX]]
Inside `ALTER CLASS ... ( ... )` only:

For non-static fields:

ADD FIELD fieldName [title] type [NOT NULL] [encoding] [BETWEEN min_expr AND max_expr] [RELATIVE TO identifier] [DEFAULT expr]
[TAGS (identifier:expr [, ...])]
[COMMENT 'comment text']

REWRITE FIELD fieldName [title] type [NOT NULL] [encoding] [BETWEEN min_expr AND max_expr] [RELATIVE TO identifier] [DEFAULT expr]
[TAGS (identifier:expr [, ...])]
[COMMENT 'comment text']

For static fields:

ADD FIELD STATIC identifier [title] type [NOT NULL] [encoding] [BETWEEN min_expr AND max_expr] = expr
[TAGS (identifier:expr [, ...])]
[COMMENT 'comment text']

REWRITE FIELD STATIC identifier [title] type [NOT NULL] [encoding] [BETWEEN min_expr AND max_expr] = expr
[TAGS (identifier:expr [, ...])]
[COMMENT 'comment text']


DROP FIELD fieldName

ALTER FIELD fieldName
SET field_option_name [=] value [, SET ...]
[DEFAULT expr]

The DEFAULT section provides a mechanism to assign a default value to be able to resolve values for NOT NULL fields.

Available field options:
- NAME: (Varchar) Field name.
- TITLE: (Varchar) class title.
- DESCRIPTION: (Varchar) class description.
- TYPE: (Varchar) Field type.
- ENCODING: (Varchar) Field encoding.
- NULL, NOT NULL: (Boolean) Alter field nullability.
- STATIC, NOT STATIC: (Boolean) Make field static/not static.
- MIN: Field min value.
- MAX: Field min value.
- RELATIVE TO: Set field relative to another field.
- TAGS: Set field attributes.

[[SECTION:ENUM_VALUE_OPS_SYNTAX]]
[[TAGS: ALTER ENUM VALUE SYNTAX]]
Inside `ALTER ENUM "EnumName" ( ... )`:

ALTER identifier SET VALUE [=] expr
ALTER identifier1 SET NAME [=] identifier2
RENAME identifier1 TO identifier2 
ADD identifier = expr
DROP identifier 
REWRITE identifier = expr

Rename is an alias for ALTER ... SET NAME.
Order of values is preserved in ADD/ALTER/DROP flow. Use `REWRITE ENUM` to redefine complete set & order.

[[SECTION:ALTER_STREAM_CONFIRM]]
[[TAGS: ALTER STREAM CONFIRM MODES DATA CONVERSION RULES]]
CONFIRM modes:
- `NO_CONVERSION`: Fails if data type changes require conversion (default if omitted).
- `CONVERT_DATA`: Allow all conversions.
- `DROP_ATTRIBUTES`: Permit removing fields.
- `DROP_TYPES`: Permit removing types.
- `DROP_DATA`: Allow dropping data not convertible (e.g., VARCHAR→FLOAT incompatible values).

[[SECTION:WHEN_TO_USE_REWRITE]]
[[TAGS: ALTER REWRITE STRATEGY USE_CASES]]
Use REWRITE when:
- Many incremental ALTER FIELD steps would be noisy.
- Reordering or pruning many enum values.
- Rebuilding a class while keeping the rest of the stream intact (lighter than full `MODIFY STREAM`).

[[SECTION:LAYERING_RULE]]
[[TAGS: ALTER LAYERING VALIDATION RULE]]
Layering validation:
- If attribute-level changes exist, the enclosing `ALTER CLASS|ENUM` must appear.
- If class/enum changes exist, they must appear inside a single `ALTER STREAM` statement.
- Illegal: referring to a field change without wrapping `ALTER CLASS`.
- Illegal: field operation at top level directly under stream parentheses.

[[SECTION:EXAMPLES_BASIC]]
[[TAGS: ALTER EXAMPLES BASIC]]
Add a new nullable field:

ALTER STREAM "quotes" (
    ALTER CLASS "deltix.timebase.api.messages.BestBidOfferMessage" (
        ADD FIELD "spread" FLOAT
    )
)

[[SECTION:EXAMPLES_MULTIPLE]]
[[TAGS: ALTER EXAMPLES MULTI COMPLEX]]
Multiple classes + enum changes in one statement:

ALTER STREAM "market" (
    ADD CLASS "Imbalance" (
        "symbolCode" VARCHAR,
        "imbalanceQty" FLOAT NOT NULL
    );
    ALTER CLASS "TradeMessage" (
        ADD FIELD "exchangeId" VARCHAR;
        ALTER FIELD "price" SET NOT NULL DEFAULT 0.0;
        DROP FIELD "deprecatedTag"
    );
    ALTER ENUM "TradeType" (
        ADD BLOCK_TRADE = 99;
        DROP UNKNOWN;
        ALTER CORRECTION SET VALUE 7
    )
)
CONFIRM CONVERT_DATA

[[SECTION:EXAMPLES_REWRITE_CLASS]]
[[TAGS: ALTER EXAMPLES REWRITE CLASS]]
Rewrite a class (full field list restated):

ALTER STREAM "quotes" (
    REWRITE CLASS "deltix.timebase.api.messages.BestBidOfferMessage" (
        "offerPrice" FLOAT DECIMAL(2),
        "bidPrice" FLOAT DECIMAL(2) RELATIVE TO "offerPrice",
        "mid" FLOAT,
        "spread" FLOAT
    )
)

[[SECTION:EXAMPLES_REWRITE_ENUM]]
[[TAGS: ALTER EXAMPLES REWRITE ENUM]]
Rewrite enum value set:

ALTER STREAM "market" (
    REWRITE ENUM "TradeType" (
        REGULAR_TRADE = 0,
        BLOCK_TRADE = 1,
        AUCTION_CLEARING_PRICE = 2
    )
)

[[SECTION:EXAMPLES_MIXED]]
[[TAGS: ALTER EXAMPLES MIXED ATTRIBUTES ENUM]]
Attribute + enum value changes:

ALTER STREAM "md" (
    ALTER CLASS "Quote" (
        ALTER FIELD "bidPrice"
            SET TYPE FLOAT NOT NULL DECIMAL(4) DEFAULT 0.0;
        ADD FIELD "bidSize" FLOAT;
        REWRITE FIELD "offerPrice" FLOAT DECIMAL(4)
    );
    ALTER ENUM "QuoteSide" (
        ADD UNKNOWN = 2
    )
)
CONFIRM DROP_DATA

[[SECTION:BEST_PRACTICES]]
[[TAGS: ALTER BEST_PRACTICES GUIDELINES]]
1. Group logically related changes in one ALTER statement.
2. Prefer ADD+ALTER over REWRITE for narrowly scoped evolution (improves audit clarity).
3. Use REWRITE sparingly; ensure downstream consumers tolerate abrupt value or field set shifts.
4. Avoid large batches mixing unrelated domain concerns—improves review and rollback safety.
5. Test historical data compatibility before tightening nullability or changing numeric types.
6. Always provide DEFAULT for new or becoming NOT NULL fields to avoid migration issues.
7. Always provide CONFIRM mode explicitly to document intent. 

[[SECTION:ERROR_PATTERNS]]
[[TAGS: ALTER ERRORS PATTERNS DIAGNOSTICS]]
Common mistakes:
1. Field op outside `ALTER CLASS` block → move inside proper wrapper.
2. Dropping class without confirming.
3. Using `ALTER FIELD` without specifying any change → no-op; remove or supply a change.
4. Forgetting quotes around identifiers.
5. Re-adding existing value via `ADD` instead of `ALTER`.
6. Using both ALTER FIELD TYPE and REWRITE FIELD simultaneously for same field (pick one).
7. Changing field type without appropriate conversion policy via `CONFIRM`.
8. Making a NOT NULL field without a DEFAULT value.

[[SECTION:DECISION_MATRIX]]
[[TAGS: ALTER DECISION MATRIX CHOICE]]
Choose operation:
- Add one field → `ALTER CLASS` + `ADD FIELD`
- Rename → `ADD FIELD new`, copy semantics, deprecate old (DROP in later ALTER) or `REWRITE CLASS`
- Massive refactor of many classes → consider `MODIFY STREAM`
- Reorder or purge many enum values → `REWRITE ENUM`

[[SECTION:REFERENCE_END]]
[[TAGS: ALTER END REFERENCE]]
End of alter stream reference.
