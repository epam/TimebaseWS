package com.epam.deltix.tbwg.services.timebase.exc;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class WriteOperationsException extends TimebaseException {

    public WriteOperationsException(String operation) {
        super(String.format("Timebase is opened in readonly mode. Operation %s cannot be performed.", operation));
    }

}
