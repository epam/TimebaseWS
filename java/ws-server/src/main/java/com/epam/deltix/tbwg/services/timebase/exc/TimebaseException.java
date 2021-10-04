package com.epam.deltix.tbwg.services.timebase.exc;

public abstract class TimebaseException extends Exception {

    public TimebaseException() {
    }

    public TimebaseException(String message) {
        super(message);
    }

    public TimebaseException(String message, Throwable cause) {
        super(message, cause);
    }

    public TimebaseException(Throwable cause) {
        super(cause);
    }

    public TimebaseException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}
