---
title: Predicates
tags: [qql, predicates, filter, this, element_filter, type_filter, field_filter, bracket_predicate, syntax, examples]
---

[[SECTION:OVERVIEW]]
[[TAGS: PREDICATES OVERVIEW PURPOSE]]
Predicates constrain selections on object / array structures. Core capabilities:
1. Element filtering with bracket predicates.
2. Type filtering within polymorphic collections.
3. Conditional field extraction (returning NULL when predicate fails).
   Implicit variable THIS references the current element inside a bracket predicate.

[[SECTION:BRACKET_PREDICATE_SYNTAX]]
[[TAGS: PREDICATES BRACKETS SYNTAX]]
Pattern:
expr[predicate]
Predicate evaluated per element (arrays / iterable object members). Elements failing predicate are omitted (or yield NULL in chained field access depending on expression form).

[[SECTION:THIS_VARIABLE]]
[[TAGS: PREDICATES THIS ELEMENT VARIABLE]]
THIS (or lowercase this if accepted) binds to the current element inside a predicate.
Example:
order.info.size[THIS > 500]
Filters size elements > 500.

[[SECTION:TYPE_FILTERING]]
[[TAGS: PREDICATES TYPE FILTER POLYMORPHISM]]
Use:
collection[THIS IS fully.qualified.ClassName]
Keeps only elements whose concrete class matches.
Example:
order[THIS IS deltix.orders.LimitOrder].info.*
Selects only LimitOrder objects, then projects their info fields.

[[SECTION:FIELD_PREDICATE_FILTERING]]
[[TAGS: PREDICATES FIELD CONDITIONAL EXTRACTION]]
You may predicate an intermediate field path. Non‑matching elements produce NULL when the subsequent field is accessed.
Example:
order.id[source == 'LO_SOURCE'].correlationId
Returns correlationId only where source == 'LO_SOURCE'; otherwise NULL.

[[SECTION:EXAMPLES_MIN]]
[[TAGS: PREDICATES EXAMPLES BASIC]]
Filter numeric elements:
SELECT order.info.size[THIS > 500] FROM orders
Type restricted projection:
SELECT order[THIS IS deltix.orders.LimitOrder].info.* FROM orders
Conditional field extraction:
SELECT order.id[source == 'LO_SOURCE'].correlationId FROM orders

[[SECTION:REFERENCE_END]]
[[TAGS: PREDICATES END REFERENCE]]
End of predicates reference.
