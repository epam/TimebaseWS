package com.epam.deltix.tbwg.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.util.time.Periodicity;

/**
 * Created by Alex Karpovich on 16/12/2019.
 */
public class PeriodicityDef {

    public PeriodicityDef(String interval, Periodicity.Type type) {
        this.interval = interval;
        this.type = type;
    }

    @JsonProperty
    public String interval;

    @JsonProperty
    public Periodicity.Type type;

}
