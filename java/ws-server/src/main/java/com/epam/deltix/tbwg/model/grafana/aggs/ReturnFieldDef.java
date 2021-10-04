package com.epam.deltix.tbwg.model.grafana.aggs;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.computations.data.base.ValueType;
import com.epam.deltix.grafana.base.annotations.ReturnField;
import org.springframework.util.StringUtils;

public class ReturnFieldDef {

    private ValueType type;
    private String constantName;

    public ValueType getType() {
        return type;
    }

    public void setType(ValueType type) {
        this.type = type;
    }

    public String getConstantName() {
        return constantName;
    }

    public void setConstantName(String constantName) {
        this.constantName = constantName;
    }

    @JsonProperty(value = "id")
    public String getId() {
        return String.format("{%s:%s}", type, constantName);
    }

    public static ReturnFieldDef create(ReturnField returnField) {
        ReturnFieldDef returnFieldDef = new ReturnFieldDef();
        returnFieldDef.setConstantName(StringUtils.isEmpty(returnField.constantName()) ? null: returnField.constantName());
        returnFieldDef.setType(returnField.value());
        return returnFieldDef;
    }
}
