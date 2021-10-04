package com.epam.deltix.tbwg.model.grafana;

import java.util.Collection;

public class FunctionInfo {

    private String name;

    private Collection<String> outputMetrics;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Collection<String> getOutputMetrics() {
        return outputMetrics;
    }

    public void setOutputMetrics(Collection<String> outputMetrics) {
        this.outputMetrics = outputMetrics;
    }
}
