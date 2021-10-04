package com.epam.deltix.tbwg.model.input;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;

/**
 * Created by Alex Karpovich on 22/06/2021.
 */
public class TypeSelection {

    public TypeSelection() {
    }

    public TypeSelection(String name) {
        this.name = name;
    }

    /**
     * Type Name
     */
    @DocumentationExample(value = "deltix.timebase.api.messages.TradeMessage", value2 = "deltix.timebase.api.messages.BestBidOfferMessage")
    @JsonProperty
    public String       name;

    /**
     * Selected fields, null means ALL fields
     */
    @DocumentationExample(value = "size")
    @JsonProperty
    public String[]     fields;
}
