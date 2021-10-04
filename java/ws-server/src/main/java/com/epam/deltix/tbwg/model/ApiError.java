package com.epam.deltix.tbwg.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ApiError {

    private String error;

    @JsonProperty("error_description")
    private String errorDescription;

    public ApiError(String error, String errorDescription) {
        this.error = error;
        this.errorDescription = errorDescription;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getErrorDescription() {
        return errorDescription;
    }

    public void setErrorDescription(String errorDescription) {
        this.errorDescription = errorDescription;
    }

    public static ApiError from(final String error, final Throwable exception) {
        return new ApiError(error, exception.getMessage());
    }

}
