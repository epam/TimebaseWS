package com.epam.deltix.tbwg.services.grafana.exc;

public class SymbolNotSetException extends ValidationException {

    private final String functionName;

    public SymbolNotSetException(String functionName) {
        this.functionName = functionName;
    }

    @Override
    public String getMessage() {
        return String.format("Function %s: symbol must be specified.", functionName);
    }
}
