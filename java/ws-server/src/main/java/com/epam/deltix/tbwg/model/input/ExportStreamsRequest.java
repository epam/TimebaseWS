package com.epam.deltix.tbwg.model.input;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;

public class ExportStreamsRequest extends ExportRequest {

    /**
     * List of stream keys to be subscribed. At least one stream key should be defined.
     */
    @DocumentationExample(value = "bars")
    @JsonProperty
    public String[]             streams;

    /**
     * Query to select data, if undefined, 'streams' parameter will be used
     */
    @DocumentationExample(value = "select * from bars")
    @JsonProperty
    public String             query;
}
