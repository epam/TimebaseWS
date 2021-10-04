package com.epam.deltix.tbwg.model.grafana;

public enum AggregationType {
    /**
     * min element from time range
     */
    MIN,
    /**
     * max element from time range
     */
    MAX,
    /**
     * mean from time range
     */
    MEAN,
    /**
     * number of elements in time range
     */
    COUNT,
    /**
     * first element from time range
     */
    FIRST,
    /**
     * last element from time range
     */
    LAST,
    /**
     * sum over elements from time range
     */
    SUM
}
