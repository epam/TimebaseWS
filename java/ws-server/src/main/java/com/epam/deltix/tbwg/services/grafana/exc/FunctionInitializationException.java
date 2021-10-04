package com.epam.deltix.tbwg.services.grafana.exc;

public class FunctionInitializationException extends ValidationException {

    private final String id;

    public FunctionInitializationException(String id, Throwable cause) {
        super(cause);
        this.id = id;
    }

    @Override
    public String getMessage() {
        return "Failed to initialize function " + id + ". Cause: " + getCause();
    }
}
