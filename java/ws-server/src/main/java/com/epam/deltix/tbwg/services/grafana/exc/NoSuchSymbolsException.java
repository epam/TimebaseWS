package com.epam.deltix.tbwg.services.grafana.exc;

import java.util.List;

public class NoSuchSymbolsException extends ValidationException {

    private final String stream;
    private final List<String> symbols;

    public NoSuchSymbolsException(String stream, List<String> symbols) {
        this.stream = stream;
        this.symbols = symbols;
    }

    @Override
    public String getMessage() {
        return String.format("Unknown symbols %s in stream %s.", symbols, stream);
    }

}
