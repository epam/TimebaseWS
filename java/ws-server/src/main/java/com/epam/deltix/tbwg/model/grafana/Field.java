package com.epam.deltix.tbwg.model.grafana;

public class Field {

    protected String name;
    protected String aggregation;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAggregation() {
        return aggregation;
    }

    public void setAggregation(String aggregation) {
        this.aggregation = aggregation;
    }
}
