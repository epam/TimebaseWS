package com.epam.deltix.tbwg.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.qsrv.hf.tickdb.lang.pub.Token;


import java.util.ArrayList;

/**
 * Created by Alex Karpovich on 08/04/2021.
 */
public class CompileResult {

    @JsonProperty()
    public ErrorLocation        errorLocation;

    @JsonProperty()
    public String               error;

    @JsonProperty()
    public ArrayList<Token>     tokens;

    public CompileResult(String error, long location, ArrayList<Token> tokens) {
        this.errorLocation = (location != -1) ? new ErrorLocation(location) : null;
        this.error = error;
        this.tokens = tokens;
    }

    public CompileResult(ArrayList<Token> tokens) {
        this.tokens = tokens;
    }
}
