package com.epam.deltix.tbwg.services.grafana.exc;

public class ConstantValidationException extends ValidationException {

    private final String name;
    private final String value;
    private final String min;
    private final String max;

    public ConstantValidationException(String name, String value, String min, String max) {
        this.name = name;
        this.value = value;
        this.min = min;
        this.max = max;
    }

    @Override
    public String getMessage() {
        return String.format("Argument %s:'%s' violates constraints min='%s', max='%s'.", name, value, min, max);
    }
}
