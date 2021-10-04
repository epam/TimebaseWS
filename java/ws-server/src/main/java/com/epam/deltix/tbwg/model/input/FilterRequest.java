package com.epam.deltix.tbwg.model.input;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.jetbrains.annotations.NotNull;

import java.util.List;
import java.util.Map;

/**
 * @author Daniil Yarmalkevich
 * Date: 6/24/2019
 */
public class FilterRequest extends BaseRequest {

    @JsonProperty
    @NotNull
    @FiltersConstraint
    public Map<String, List<RawFilter>> filters;
}
