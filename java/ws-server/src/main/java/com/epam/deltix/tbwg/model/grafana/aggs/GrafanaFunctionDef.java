package com.epam.deltix.tbwg.model.grafana.aggs;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.grafana.base.annotations.GrafanaAggregation;
import com.epam.deltix.grafana.base.annotations.GrafanaFunction;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class GrafanaFunctionDef {

    private String name;
    private String group;
    private String doc;
    private boolean isAggregation;
    private List<FieldArgumentDef> fields;
    private List<ConstantArgumentDef> constants;
    private List<ReturnFieldDef> returnFields;

    public GrafanaFunctionDef() {
    }

    @JsonProperty(value = "id")
    public String getId() {
        StringBuilder sb = new StringBuilder();
        sb.append(group).append('.').append(name).append('(');
        sb.append("fields:[");
        if (fields != null && !fields.isEmpty()) {
            for (FieldArgumentDef field : fields) {
                sb.append(field.getId()).append(",");
            }
            sb.setLength(sb.length() - 1);
        }
        sb.append("],constants:[");
        if (constants != null && !constants.isEmpty()) {
            for (ConstantArgumentDef constant : constants) {
                sb.append(constant.getId()).append(",");
            }
            sb.setLength(sb.length() - 1);
        }
        sb.append("]),returns:(");
        if (returnFields != null && !returnFields.isEmpty()) {
            for (ReturnFieldDef returnField : returnFields) {
                sb.append(returnField.getId()).append(",");
            }
            sb.setLength(sb.length() - 1);
        }
        sb.append(")");
        return sb.toString();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGroup() {
        return group;
    }

    public void setGroup(String group) {
        this.group = group;
    }

    public String getDoc() {
        return doc;
    }

    public void setDoc(String doc) {
        this.doc = doc;
    }

    @JsonProperty(value = "isAggregation")
    public boolean isAggregation() {
        return isAggregation;
    }

    public void setAggregation(boolean aggregation) {
        isAggregation = aggregation;
    }

    public List<FieldArgumentDef> getFields() {
        return fields;
    }

    public void setFields(List<FieldArgumentDef> fields) {
        this.fields = fields;
    }

    public List<ConstantArgumentDef> getConstants() {
        return constants;
    }

    public void setConstants(List<ConstantArgumentDef> constants) {
        this.constants = constants;
    }

    public List<ReturnFieldDef> getReturnFields() {
        return returnFields;
    }

    public void setReturnFields(List<ReturnFieldDef> returnFields) {
        this.returnFields = returnFields;
    }

    public static GrafanaFunctionDef create(GrafanaFunction function) {
        GrafanaFunctionDef functionDef = new GrafanaFunctionDef();
        functionDef.setAggregation(false);
        functionDef.setName(function.name());
        functionDef.setGroup(function.group());
        functionDef.setDoc(function.doc());
        functionDef.setConstants(
                Arrays.stream(function.constantArguments())
                        .map(ConstantArgumentDef::create)
                        .collect(Collectors.toList())
        );
        functionDef.setFields(
                Arrays.stream(function.fieldArguments())
                        .map(FieldArgumentDef::create)
                        .collect(Collectors.toList())
        );
        functionDef.setReturnFields(
                Arrays.stream(function.returnFields())
                        .map(ReturnFieldDef::create)
                        .collect(Collectors.toList())
        );
        return functionDef;
    }

    public static GrafanaFunctionDef create(GrafanaAggregation function) {
        GrafanaFunctionDef functionDef = new GrafanaFunctionDef();
        functionDef.setAggregation(true);
        functionDef.setName(function.name());
        functionDef.setGroup(function.group());
        functionDef.setDoc(function.doc());
        functionDef.setConstants(
                Arrays.stream(function.constantArguments())
                        .map(ConstantArgumentDef::create)
                        .collect(Collectors.toList())
        );
        functionDef.setFields(
                Arrays.stream(function.fieldArguments())
                        .map(FieldArgumentDef::create)
                        .collect(Collectors.toList())
        );
        functionDef.setReturnFields(
                Arrays.stream(function.returnFields())
                        .map(ReturnFieldDef::create)
                        .collect(Collectors.toList())
        );
        return functionDef;
    }
}
