package com.epam.deltix.tbwg.model.grafana;

import java.util.List;
import java.util.Map;

public class StreamInfo {

    private List<String> types;
    private List<String> symbols;
    private Map<String, List<String>> numericFields;

    public List<String> getTypes() {
        return types;
    }

    public void setTypes(List<String> types) {
        this.types = types;
    }

    public List<String> getSymbols() {
        return symbols;
    }

    public void setSymbols(List<String> symbols) {
        this.symbols = symbols;
    }

    public Map<String, List<String>> getNumericFields() {
        return numericFields;
    }

    public void setNumericFields(Map<String, List<String>> numericFields) {
        this.numericFields = numericFields;
    }

}
