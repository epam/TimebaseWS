package com.epam.deltix.tbwg.model.input;

import com.epam.deltix.tbwg.model.filter.FilterType;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.jetbrains.annotations.NotNull;

import java.util.List;

/**
 * @author Daniil Yarmalkevich
 * Date: 6/24/2019
 */
public class RawFilter {

    @JsonProperty
    @NotNull
    public FilterType type;

    @JsonProperty
    public List<String> data;
}
