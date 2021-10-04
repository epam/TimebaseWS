package com.epam.deltix.tbwg.services.timebase.exc;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class NoStreamsException extends TimebaseException {

    public NoStreamsException(String ... streams) {
        super(streams == null || streams.length == 0 ? "No streams provided in request.":
                String.format("No streams [%s] found.", String.join(", ", streams)));
    }

}
