package com.epam.deltix.tbwg.model.input;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;

/**
 * Request for selecting data from specified stream using QQL/DDL getQuery.
 */
public class QueryRequest extends StreamRequest {

    /**
     * QQL Query String.
     */
    @DocumentationExample(value = "SELECT * FROM trades WHERE size > 1000")
    @JsonProperty
    public String             query;
}
