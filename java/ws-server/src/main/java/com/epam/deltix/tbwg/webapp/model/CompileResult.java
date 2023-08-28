/*
 * Copyright 2023 EPAM Systems, Inc
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.epam.deltix.tbwg.webapp.model;

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
