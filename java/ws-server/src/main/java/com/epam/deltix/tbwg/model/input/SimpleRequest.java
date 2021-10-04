package com.epam.deltix.tbwg.model.input;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;

import java.time.Instant;


/**
 * Base Request for the operations with stream.
 */
public class SimpleRequest {
    @DocumentationExample("1709734565")
    @JsonProperty
    //@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    public long timestamp;

    @DocumentationExample(value = "BTCEUR", value2 = "ETHEUR")
    @JsonProperty
    public String[]             symbols;

}
