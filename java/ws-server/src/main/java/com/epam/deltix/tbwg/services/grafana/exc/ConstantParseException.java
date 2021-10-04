package com.epam.deltix.tbwg.services.grafana.exc;

import com.epam.deltix.grafana.base.annotations.ConstantArgument;

public class ConstantParseException extends ValidationException {

    private final ConstantArgument argument;
    private final String value;

    public ConstantParseException(ConstantArgument argument, String value) {
        this.argument = argument;
        this.value = value;
    }

    @Override
    public String getMessage() {
        return String.format("Argument %s: '%s' cannot be parsed to type '%s'", argument.name(), value,
                argument.type().name());
    }
}
