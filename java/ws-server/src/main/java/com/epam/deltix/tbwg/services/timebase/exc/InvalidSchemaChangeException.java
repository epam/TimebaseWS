package com.epam.deltix.tbwg.services.timebase.exc;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidSchemaChangeException extends TimebaseException {

    public InvalidSchemaChangeException(String fieldName) {
        super(String.format("Default value must be set for field '%s'.", fieldName));
    }

}
