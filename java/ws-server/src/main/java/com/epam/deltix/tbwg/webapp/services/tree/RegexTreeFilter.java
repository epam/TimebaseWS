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

package com.epam.deltix.tbwg.webapp.services.tree;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.model.tree.FilterMatchType;

import java.util.Objects;
import java.util.regex.Pattern;

public class RegexTreeFilter implements TreeFilter {

    private static final Log LOGGER = LogFactory.getLog(RegexTreeFilter.class);

    private final String filter;
    private final FilterMatchType matchType;

    private final Pattern pattern;

    public RegexTreeFilter(String filter, FilterMatchType matchType) {
        Objects.requireNonNull(filter);

        this.matchType = matchType == null ? FilterMatchType.any : matchType;
        this.filter = matchType == FilterMatchType.exactly ? makeExactlyRegex(filter) : filter;
        this.pattern = initPattern(this.filter);
    }

    private String makeExactlyRegex(String filter) {
        String result = filter;
        if (!result.startsWith("^")) {
            result = "^" + result;
        }
        if (!result.endsWith("$")) {
            result = result + "$";
        }

        return result;
    }

    private Pattern initPattern(String filter) {
        try {
            return Pattern.compile(filter, Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);
        } catch (Throwable t) {
            LOGGER.error().append("Failed to compile tree filter regex").append(t).commit();
            return null;
        }
    }

    public boolean test(String value) {
        if (value == null || pattern == null) {
            return false;
        }

        return pattern.matcher(value).find();
    }

}
