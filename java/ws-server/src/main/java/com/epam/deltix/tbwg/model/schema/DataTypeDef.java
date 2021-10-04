package com.epam.deltix.tbwg.model.schema;

import java.util.List;

/**
 * Created by Alex Karpovich on 13/11/2020.
 */
public class DataTypeDef {

    public DataTypeDef() { // for serialization
    }

    public DataTypeDef(String name, String encoding, boolean nullable) {
        this.encoding = encoding;
        this.nullable = nullable;
        this.name = name;
    }

    private String encoding;
    private boolean nullable;
    private String name;
    private List<String> types;
    private DataTypeDef elementType;

    public String getEncoding() {
        return encoding;
    }

    public void setEncoding(String encoding) {
        this.encoding = encoding;
    }

    public boolean isNullable() {
        return nullable;
    }

    public void setNullable(boolean nullable) {
        this.nullable = nullable;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<String> getTypes() {
        return types;
    }

    public void setTypes(List<String> types) {
        this.types = types;
    }

    public DataTypeDef getElementType() {
        return elementType;
    }

    public void setElementType(DataTypeDef elementType) {
        this.elementType = elementType;
    }
}
