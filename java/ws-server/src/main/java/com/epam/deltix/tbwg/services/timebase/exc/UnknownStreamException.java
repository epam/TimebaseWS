package com.epam.deltix.tbwg.services.timebase.exc;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class UnknownStreamException extends TimebaseException {

    public UnknownStreamException(String key) {
        super(String.format("Unknown stream %s.", key));
    }

}
