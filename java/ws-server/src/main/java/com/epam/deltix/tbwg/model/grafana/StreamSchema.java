package com.epam.deltix.tbwg.model.grafana;

import com.epam.deltix.tbwg.model.grafana.aggs.GrafanaFunctionDef;

import java.util.Collection;

public class StreamSchema {

    private Collection<TypeInfo> types;

    private Collection<GrafanaFunctionDef> functions;

    public Collection<TypeInfo> getTypes() {
        return types;
    }

    public void setTypes(Collection<TypeInfo> types) {
        this.types = types;
    }

    public Collection<GrafanaFunctionDef> getFunctions() {
        return functions;
    }

    public void setFunctions(Collection<GrafanaFunctionDef> functions) {
        this.functions = functions;
    }
}
