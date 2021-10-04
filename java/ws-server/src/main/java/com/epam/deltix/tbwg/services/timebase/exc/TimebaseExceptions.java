package com.epam.deltix.tbwg.services.timebase.exc;

public class TimebaseExceptions {

    public static UnknownStreamException unknownStream(String key) {
        return new UnknownStreamException(key);
    }

    public static WriteOperationsException schemaChangeForbidden() {
        return new WriteOperationsException("schema change");
    }

    public static WriteOperationsException writeToStreamForbidden() {
        return new WriteOperationsException("write to stream");
    }

    public static WriteOperationsException createStreamForbidden() {
        return new WriteOperationsException("create stream");
    }
}
