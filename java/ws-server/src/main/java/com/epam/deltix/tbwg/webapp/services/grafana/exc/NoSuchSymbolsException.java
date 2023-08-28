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
package com.epam.deltix.tbwg.webapp.services.grafana.exc;

import java.util.List;

public class NoSuchSymbolsException extends ValidationException {

    private final String stream;
    private final List<String> symbols;

    public NoSuchSymbolsException(String stream, List<String> symbols) {
        this.stream = stream;
        this.symbols = symbols;
    }

    @Override
    public String getMessage() {
        return String.format("Unknown symbols %s in stream %s.", symbols, stream);
    }

}
