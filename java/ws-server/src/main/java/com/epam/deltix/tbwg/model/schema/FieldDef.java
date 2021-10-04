package com.epam.deltix.tbwg.model.schema;

import com.fasterxml.jackson.annotation.JsonProperty;

import javax.annotation.Nullable;

/**
 * Schema field definition.
 */
public class FieldDef {

    public FieldDef() {
    }

    /**
     * Default visibility state.
     */
    @JsonProperty("hide")
    private boolean hidden = false;

    /**
     * Field Name.
     */
    @JsonProperty
    private String name;

    /**
     * Field Title.
     */
    @JsonProperty
    private String title;

    /**
     * Field Data Type.
     */
    @JsonProperty
    private DataTypeDef type;

    /**
     * Static fields indicator
     */
    @JsonProperty(value = "static")
    private boolean isStatic = false;

    @JsonProperty
    @Nullable
    private String value;

    public boolean isHidden() {
        return hidden;
    }

    public void setHidden(boolean hidden) {
        this.hidden = hidden;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public DataTypeDef getType() {
        return type;
    }

    public void setType(DataTypeDef type) {
        this.type = type;
    }

    public boolean isStatic() {
        return isStatic;
    }

    public void setStatic(boolean aStatic) {
        isStatic = aStatic;
    }

    @Nullable
    public String getValue() {
        return value;
    }

    public void setValue(@Nullable String value) {
        this.value = value;
    }

    public static FieldDef createNonStatic(String name, String title, DataTypeDef type) {
        FieldDef fieldDef = new FieldDef();
        fieldDef.name = name;
        fieldDef.type = type;
        fieldDef.title = title;
        fieldDef.isStatic = false;
        return fieldDef;
    }

    public static FieldDef createStatic(String name, String title, DataTypeDef type, String value) {
        FieldDef fieldDef = new FieldDef();
        fieldDef.name = name;
        fieldDef.type = type;
        fieldDef.title = title;
        fieldDef.isStatic = true;
        fieldDef.value = value;
        return fieldDef;
    }
}
