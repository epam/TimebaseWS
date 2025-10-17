---
title: Attribute Definition
tags: [ddl, attribute, syntax, static, non-static, tags, comment, default, relative, constraint, between, metadata, best-practices, examples]
---

[[SECTION:ATTRIBUTE_OVERVIEW]]
[[TAGS: ATTRIBUTE OVERVIEW DDL FIELD DEFINITION]]
Attributes define data fields inside CLASS declarations. Two categories: static (compile\-time constant) and non\-static (value per message).

[[SECTION:ATTRIBUTE_STATIC_SYNTAX]]
[[TAGS: ATTRIBUTE STATIC SYNTAX CONSTANT]]
Static attribute syntax (value embedded; not transmitted):
STATIC name [title] type [NOT NULL] [encoding] [BETWEEN min_expr AND max_expr] = const_expr
TAGS (key:expr[, ...])
COMMENT comment

[[SECTION:ATTRIBUTE_NON_STATIC_SYNTAX]]
[[TAGS: ATTRIBUTE NON_STATIC SYNTAX REGULAR]]
Non\-static attribute syntax (value supplied in each message unless defaulted):
name [title] type [NOT NULL] [encoding]
[BETWEEN min_expr AND max_expr]
[RELATIVE TO otherField]
[DEFAULT expr]
TAGS (key:expr[, ...])
COMMENT comment

[[SECTION:ATTRIBUTE_NULLABILITY]]
[[TAGS: ATTRIBUTE NULLABILITY NOT_NULL]]
Attributes are nullable unless suffixed with NOT NULL. Use NOT NULL only when upstream feed guarantees presence.

[[SECTION:ATTRIBUTE_CONSTANTS]]
[[TAGS: ATTRIBUTE STATIC CONSTANT VALUE]]
STATIC attributes:
1. Must provide = const_expr.
2. Common use: schema version, producer id, invariant domain metadata.
3. Are effectively NOT NULL by semantics (explicit NOT NULL optional).

[[SECTION:ATTRIBUTE_DEFAULTS]]
[[TAGS: ATTRIBUTE DEFAULT VALUE INITIALIZATION]]
DEFAULT supplies a value when producer omits the field. It does not override an explicitly transmitted value.

[[SECTION:ATTRIBUTE_RELATIVE_TO]]
[[TAGS: ATTRIBUTE RELATIVE TO DEPENDENCY ENCODING]]
RELATIVE TO declares dependency (e.g., delta or relative encoding) on a previously declared field. The referenced field must appear earlier in the class.

[[SECTION:ATTRIBUTE_BETWEEN_CONSTRAINT]]
[[TAGS: ATTRIBUTE BETWEEN CONSTRAINT RANGE BOUNDS]]
BETWEEN min_expr AND max_expr documents (and if supported enforces) numeric bounds. Use only with numeric types. Keep ranges meaningful (avoid overly loose bounds).

[[SECTION:ATTRIBUTE_TAGS_METADATA]]
[[TAGS: ATTRIBUTE TAGS METADATA KEY VALUE]]
TAGS clause attaches retrieval metadata as key:value pairs:
TAGS (source:'vendorA', precision:6)
Keys must be unique within the list. Treat them as stable retrieval handles.

[[SECTION:ATTRIBUTE_COMMENT]]
[[TAGS: ATTRIBUTE COMMENT DOC]]
COMMENT adds a concise human description. Avoid redundancy with the attribute name.

[[SECTION:ATTRIBUTE_EXAMPLES_BASIC]]
[[TAGS: ATTRIBUTE EXAMPLES BASIC]]
Basic class:
CLASS "InstrumentMetrics" (
    STATIC vendor VARCHAR = 'FeedX',
    symbolCode VARCHAR NOT NULL,
    midPrice FLOAT,
    midPriceQuality INTEGER DEFAULT 0
)

[[SECTION:ATTRIBUTE_EXAMPLES_STATIC]]
[[TAGS: ATTRIBUTE EXAMPLES STATIC CONSTANT]]
Static attribute with TAGS + COMMENT:
CLASS "FeedStamped" (
    STATIC feedId INTEGER = 42 TAGS (region:"EU") COMMENT 'Feed identifier',
    price FLOAT
)

[[SECTION:ATTRIBUTE_EXAMPLES_NON_STATIC]]
[[TAGS: ATTRIBUTE EXAMPLES NON_STATIC DEFAULT RELATIVE]]
Relative + bounds:
CLASS "QuotedSpread" (
    bid FLOAT NOT NULL,
    ask FLOAT NOT NULL BETWEEN 0 AND 100000,
    spread FLOAT RELATIVE TO ask DEFAULT 0.0
)

[[SECTION:ATTRIBUTE_EXAMPLES_FULL]]
[[TAGS: ATTRIBUTE EXAMPLES FULL COMPREHENSIVE]]
Combined features:
CLASS "DepthSnapshot" (
    STATIC schemaVersion INTEGER = 3,
    levels FLOAT NOT NULL BETWEEN 0 AND 1000 TAGS (role:"L2"),
    currency VARCHAR DEFAULT 'USD' TAGS (iso:"true") COMMENT 'Currency code',
    updateId LONG NOT NULL
)

[[SECTION:ATTRIBUTE_BEST_PRACTICES]]
[[TAGS: ATTRIBUTE BEST_PRACTICES GUIDELINES]]
1. Use STATIC only for true invariants (version, feed id).
2. Declare dependencies before fields using RELATIVE TO.
3. Apply NOT NULL strictly (no speculative constraints).
4. Keep TAG keys stable and minimal.
5. Provide DEFAULT only when semantically neutral.
6. Constrain numeric attributes with realistic BETWEEN bounds.

[[SECTION:ATTRIBUTE_ANTI_PATTERNS]]
[[TAGS: ATTRIBUTE ANTI_PATTERNS BAD PRACTICES]]
Avoid:
- Marking NOT NULL when feed can emit null / omit field.
- RELATIVE TO unrelated or forward\-declared field.
- DEFAULT that masks upstream anomalies.
- Duplicated STATIC constants across sibling classes (factor to base).
- Large arbitrary TAG sets with no retrieval use.
- Overly broad BETWEEN (0 to 10^12 without reason).

[[SECTION:ATTRIBUTE_MIGRATION_NOTES]]
[[TAGS: ATTRIBUTE MIGRATION EVOLUTION VERSIONING]]
Schema evolution:
1. Adding a nullable field is backward compatible.
2. Tightening nullability requires data guarantee (may break readers).
3. Changing STATIC value implies schema version change (consider explicit version field).
4. Removing or renaming fields can break consumers; deprecate first via COMMENT/TAGS.

[[SECTION:ATTRIBUTE_QUICK_REFERENCE]]
[[TAGS: ATTRIBUTE QUICK_REFERENCE CHEATSHEET]]
Cheat sheet:
Static: STATIC name TYPE = const
Non\-static: name TYPE [DEFAULT x]
Bounds: name TYPE BETWEEN a AND b
Relative: name TYPE RELATIVE TO baseField
Tags: name TYPE TAGS (k:"v")
Default + relative: val FLOAT RELATIVE TO base DEFAULT 0.0

[[SECTION:ATTRIBUTE_REFERENCE_END]]
[[TAGS: ATTRIBUTE END REFERENCE]]
End of attribute definition reference.
