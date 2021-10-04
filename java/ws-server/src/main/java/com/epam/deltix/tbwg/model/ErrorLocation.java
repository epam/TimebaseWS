package com.epam.deltix.tbwg.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.util.parsers.Location;

/**
 * Created by Alex Karpovich on 10/06/2021.
 */
public class ErrorLocation {

    @JsonProperty()
    public int startLine;
    @JsonProperty()
    public int endLine;

    @JsonProperty()
    public long startPosition;
    @JsonProperty()
    public long endPosition;

    public ErrorLocation(long encodedLocation) {
        this.startLine = Location.getStartLine(encodedLocation);
        this.endLine = Location.getEndLine(encodedLocation);

        this.startPosition = Location.getStartPosition(encodedLocation);
        this.endPosition = Location.getEndPosition(encodedLocation);
    }
}
