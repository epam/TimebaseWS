package com.epam.deltix.grafana;

import com.epam.deltix.computations.data.base.MutableArguments;
import com.epam.deltix.grafana.base.annotations.ConstantArgument;

public final class GrafanaUtil {

    private GrafanaUtil() {}

    public static void setArgument(ConstantArgument argument, String value, MutableArguments mutableArguments) {
        switch (argument.type()) {
            case INT8:
                break;
            case INT16:
                break;
        }
    }

}
