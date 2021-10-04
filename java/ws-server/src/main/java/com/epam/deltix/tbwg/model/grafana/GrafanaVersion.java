package com.epam.deltix.tbwg.model.grafana;

import com.fasterxml.jackson.annotation.JsonProperty;

public class GrafanaVersion {

    private static String VERSION = GrafanaVersion.class.getPackage().getImplementationVersion();

    /**
     * Name
     */
    @JsonProperty
    public String name = "TimeBase backend for Grafana";

    /**
     * Current version
     */
    @JsonProperty
    public String version = VERSION;

    /**
     * Current time
     */
    @JsonProperty
    public long timestamp = System.currentTimeMillis();

}
