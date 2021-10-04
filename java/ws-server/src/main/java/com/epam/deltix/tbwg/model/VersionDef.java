package com.epam.deltix.tbwg.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * API Version information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VersionDef {

    /**
     * Name
     */
    private String name;

    /**
     * Current version
     */
    private String version;

    /**
     * Current time
     */
    private long timestamp;

    /**
     * TimeBase info
     */
    private TimeBase timebase;

    @JsonProperty
    public boolean authentication = true;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeBase {

        /**
         * Client version
         */
        private String clientVersion;

        /**
         * Server version
         */
        private String serverVersion;

    }

}
