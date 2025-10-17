---
title: Object Data Type
tags: [ddl, data_types, object, structured, polymorphic, nesting, size_limit, constraints, examples]
---

[[SECTION:OVERVIEW]]
[[TAGS: OBJECT OVERVIEW STRUCTURED]]
OBJECT defines an inlined structured value composed of an ordered sequence of fields. Objects may contain:
- Other OBJECTs
- Arrays of OBJECTs
- Arbitrarily deep nesting (subject to size limit)
  Circular object references are disallowed.

[[SECTION:SIZE_LIMIT]]
[[TAGS: OBJECT SIZE LIMIT]]
Maximum encoded size: up to 4,194,304 bytes per OBJECT value.

[[SECTION:POLYMORPHIC_OBJECTS]]
[[TAGS: OBJECT POLYMORPHIC VARIANT]]
Polymorphic form: OBJECT("ClassA", "ClassB", ...)
Allows one of several declared object class types. All listed classes must be compatible with schema tooling. Circular inclusion still prohibited.

[[SECTION:DECLARATION_SYNTAX]]
[[TAGS: OBJECT DECLARATION SYNTAX]]
Single concrete object field:
fieldName "fully.qualified.ClassName" [NOT NULL]

Polymorphic object field:
fieldName OBJECT("ClassA", "ClassB"[, ...]) [NOT NULL]

[[SECTION:CONSTRAINTS]]
[[TAGS: OBJECT CONSTRAINTS RULES]]
1. No circular references.
2. Nesting depth limited only by overall size.
3. Polymorphic list explicitly enumerated—no implicit expansion.

[[SECTION:EXAMPLES_MIN]]
[[TAGS: OBJECT EXAMPLES BASIC]]
CLASS "epam.rtc.timebase.samples.SampleObjectMessage" 'Sample Object Message' (
    "object"          'Object'               "epam.rtc.timebase.samples.CustomAttribute" NOT NULL,
    "object_nullable" 'Object (Nullable)'    "epam.rtc.timebase.samples.CustomAttribute",
    "poly_object"     'Polymorphic Object'   OBJECT("epam.rtc.timebase.samples.CustomAttribute", "epam.rtc.timebase.samples.DeltaAttribute") NOT NULL
)

[[SECTION:REFERENCE_END]]
[[TAGS: OBJECT END REFERENCE]]
End of object type reference.
