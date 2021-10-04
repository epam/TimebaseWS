package com.epam.deltix.tbwg.model.schema;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Optional;
import java.util.stream.Stream;

/**
 * Schema type description.
 */
public class TypeDef {

    public TypeDef() { // for serialization
    }

    public TypeDef(String name, String title, FieldDef[] fields) {
        this.name = name != null ? name : "";
        this.title = title;
        this.fields = fields;
    }

    /**
     * Marks if this is enum descriptor
     */
    private boolean isEnum = false;

    /**
     * Type name
     */
    private String name;

    /**
     * Type title
     */
    private String title;

    /*
     *  List of fields
     */
    private FieldDef[] fields;

    /*
     *   Name of the parent TypeDef
     */
    private String parent;

    /**
     * Marks if class is abstract
     */
    private boolean isAbstract;

    @JsonProperty("isEnum")
    public boolean isEnum() {
        return isEnum;
    }

    public void setEnum(boolean anEnum) {
        isEnum = anEnum;
    }

    @JsonProperty("name")
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @JsonProperty("title")
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    @JsonProperty("fields")
    public FieldDef[] getFields() {
        return fields;
    }

    public void setFields(FieldDef[] fields) {
        this.fields = fields;
    }

    @JsonProperty("parent")
    public String getParent() {
        return parent;
    }

    public void setParent(String parent) {
        this.parent = parent;
    }

    /*
     *   Set column visible if found
     */
    public void setVisible(String fieldName) {
        Optional<FieldDef> first = Stream.of(fields).filter(x -> fieldName.equals(x.getName())).findFirst();
        first.ifPresent(fieldDef -> fieldDef.setHidden(false));
    }

    @JsonProperty("isAbstract")
    public boolean isAbstract() {
        return isAbstract;
    }

    public void setAbstract(boolean anAbstract) {
        isAbstract = anAbstract;
    }
}
