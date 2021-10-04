package com.epam.deltix.tbwg.services.grafana.exc;

public class NoSuchFunctionException extends ValidationException {

    private final String id;

    public NoSuchFunctionException(String id) {
        this.id = id;
    }

    @Override
    public String getMessage() {
        return "Unknown function " + id;
    }
}
