package com.epam.deltix.tbwg.model.schema;

import java.util.Arrays;
import java.util.Optional;

/**
 * Stream schema definition
 */
public class SchemaDef {

    /**
     * Schema top-types list (used to represent messages)
     */
    public TypeDef[]   types;

    /**
     * Schema all-types list (including enumeration and nested types)
     */
    public TypeDef[]   all;


    public TypeDef          find(String name) {
        Optional<TypeDef> type = Arrays.stream(all)
                .filter(s -> s.getName().equals(name))
                .findAny();

        return type.orElse(null);
    }
}
