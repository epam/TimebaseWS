package com.epam.deltix.tbwg.model.input;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;

/**
 * Request for selecting data from specified stream using specified symbol.
 */
public class InstrumentRequest extends BaseRequest {

    /**
     * Specified message types to be subscribed. If undefined, then all types will be subscribed.
     */
    @DocumentationExample(value = "deltix.timebase.api.messages.L2Message", value2 = "deltix.timebase.api.messages.universal.PackageHeader")
    @JsonProperty
    public String[]             types;
}
