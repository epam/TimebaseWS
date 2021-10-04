package com.epam.deltix.tbwg.model.ws.system;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RenameMessage {

    private String oldName;
    private String newName;

    public RenameMessage() {}

    public RenameMessage(String oldName, String newName) {
        this.oldName = oldName;
        this.newName = newName;
    }

    @JsonProperty("oldName")
    public String getOldName() {
        return oldName;
    }

    public void setOldName(String oldName) {
        this.oldName = oldName;
    }

    @JsonProperty("newName")
    public String getNewName() {
        return newName;
    }

    public void setNewName(String newName) {
        this.newName = newName;
    }

    @Override
    public String toString() {
        return "{oldName='" + oldName + '\'' +
                ", newName='" + newName + '\'' +
                '}';
    }
}
