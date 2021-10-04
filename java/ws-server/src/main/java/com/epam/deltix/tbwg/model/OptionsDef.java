package com.epam.deltix.tbwg.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.qsrv.hf.tickdb.pub.BufferOptions;
import com.epam.deltix.qsrv.hf.tickdb.pub.StreamScope;

/**
 * Created by Alex Karpovich on 4/29/2019.
 */
public class OptionsDef {

    @JsonProperty
    public String key = null;

    @JsonProperty
    public String name = null;

    @JsonProperty
    public String description = null;

    @JsonProperty
    public int distributionFactor = 0;

    @JsonProperty
    public BufferOptions bufferOptions;

    @JsonProperty
    public StreamScope  scope;

    @JsonProperty
    public PeriodicityDef  periodicity;

    @JsonProperty
    public boolean      highAvailability;

    @JsonProperty
    public String       owner;

    @JsonProperty
    public TimeRangeDef range;
}
