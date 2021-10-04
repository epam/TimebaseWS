package com.epam.deltix.grafana.basicmath;

class BasicMathUtils {

    static String fieldName(String function, String name) {
        return String.format("%s(%s)", function, name);
    }

    static String maxFieldName(String name) {
        return fieldName("max", name);
    }

    static String minFieldName(String name) {
        return fieldName("min", name);
    }

    static String meanFieldName(String name) {
        return fieldName("mean", name);
    }

    static String countFieldName(String name) {
        return fieldName("count", name);
    }

    static String sumFieldName(String name) {
        return fieldName("sum", name);
    }

}
