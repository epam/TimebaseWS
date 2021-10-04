package com.epam.deltix.tbwg.model.schema;

import java.util.Map;
import java.util.Set;

public class ChangeSchemaRequest extends SchemaChangesRequest {

    private Map<String, Map<String, String>> defaultValues;

    private Map<String, Set<String>> dropValues;

    private boolean background;

    public Map<String, Set<String>> getDropValues() {
        return dropValues;
    }

    public void setDropValues(Map<String, Set<String>> dropValues) {
        this.dropValues = dropValues;
    }

    public Map<String, Map<String, String>> getDefaultValues() {
        return defaultValues;
    }

    public void setDefaultValues(Map<String, Map<String, String>> defaultValues) {
        this.defaultValues = defaultValues;
    }

    public boolean isBackground() {
        return background;
    }

    public void setBackground(boolean background) {
        this.background = background;
    }
}
