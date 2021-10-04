package com.epam.deltix.tbwg.services.timebase.exc;

public class InvalidQueryException extends TimebaseException {

    public InvalidQueryException(String query) {
        super("Invalid query '" + query + "'");
    }

}
