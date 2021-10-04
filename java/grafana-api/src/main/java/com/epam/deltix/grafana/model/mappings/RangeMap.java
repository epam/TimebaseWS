package com.epam.deltix.grafana.model.mappings;

import com.epam.deltix.grafana.model.fields.MappingType;

public class RangeMap extends ValueMapping {

    protected String from;
    protected String to;

    public RangeMap(long id, String operator, String text, String from, String to) {
        super(id, operator, text, MappingType.RangeToText);
        this.from = from;
        this.to = to;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
    }
}
