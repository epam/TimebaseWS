package com.epam.deltix.tbwg.model.grafana.queries;

public class TBQuery extends DataQuery {

    protected String stream;

    public String getStream() {
        return stream;
    }

    public void setStream(String stream) {
        this.stream = stream;
    }
}
