package com.epam.deltix.tbwg.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DownloadId {

    @JsonProperty
    public final String id;

    public DownloadId(String id) {
        this.id = id;
    }
}
