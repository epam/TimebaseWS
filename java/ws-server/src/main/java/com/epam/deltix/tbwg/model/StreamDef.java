package com.epam.deltix.tbwg.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Created by Alex Karpovich on 9/10/2018.
 */
public class StreamDef {

    public StreamDef(String key, String name, int symbols) {
        this.name = name != null ? name : key;
        this.key = key;
        this.symbols = symbols;
    }

    @JsonProperty
    public String       name;

    @JsonProperty
    public String       key;

    @JsonProperty
    public int          symbols;
}
