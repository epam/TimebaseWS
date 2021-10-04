package com.epam.deltix.tbwg.model.grafana.aggs;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.computations.data.base.ArgumentType;
import com.epam.deltix.grafana.base.annotations.ConstantArgument;
import org.springframework.util.StringUtils;

public class ConstantArgumentDef {

    private String name;
    private ArgumentType type;
    private String defaultValue;
    private String min;
    private String max;
    private String doc;

    @JsonProperty(value = "id")
    public String getId() {
        return String.format("%s:%s", name, type);
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ArgumentType getType() {
        return type;
    }

    public void setType(ArgumentType type) {
        this.type = type;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
    }

    public String getMin() {
        return min;
    }

    public void setMin(String min) {
        this.min = min;
    }

    public String getMax() {
        return max;
    }

    public void setMax(String max) {
        this.max = max;
    }

    public String getDoc() {
        return doc;
    }

    public void setDoc(String doc) {
        this.doc = doc;
    }

    public static ConstantArgumentDef create(ConstantArgument argument) {
        ConstantArgumentDef argumentDef = new ConstantArgumentDef();
        argumentDef.setName(argument.name());
        argumentDef.setType(argument.type());
        argumentDef.setDoc(argument.doc());
        argumentDef.setMax(StringUtils.isEmpty(argument.max()) ? null: argument.max());
        argumentDef.setMin(StringUtils.isEmpty(argument.min()) ? null: argument.min());
        argumentDef.setDefaultValue(StringUtils.isEmpty(argument.defaultValue()) ? null: argument.defaultValue());
        return argumentDef;
    }
}
