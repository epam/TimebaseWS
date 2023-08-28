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
package com.epam.deltix.tbwg.webapp.settings;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
@ConfigurationProperties(prefix = "timebase")
public class TimebaseSettings {

    private String url;
    private String user;
    private String password;
    private StreamsFilter streams;
    private boolean readonly;
    private String currencies;
    private long flushPeriodMs = 500;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public StreamsFilter getStreams() {
        return streams;
    }

    public void setStreams(StreamsFilter streams) {
        this.streams = streams;
    }

    public boolean isReadonly() {
        return readonly;
    }

    public void setReadonly(boolean readonly) {
        this.readonly = readonly;
    }

    public String getCurrencies() {
        return currencies;
    }

    public void setCurrencies(String currencies) {
        this.currencies = currencies;
    }

    public boolean isMatched(String name) {
        return streams == null || streams.isMatched(name);
    }

    public long getFlushPeriodMs() {
        return flushPeriodMs;
    }

    public void setFlushPeriodMs(long flushPeriodMs) {
        this.flushPeriodMs = flushPeriodMs;
    }

    public static class StreamsFilter {

        private String include;
        private String exclude;

        private Pattern iPattern;
        private Pattern ePattern;

        public String getInclude() {
            return include;
        }

        public void setInclude(String include) {
            this.include = include;
            if (include != null && include.length() > 0)
                this.iPattern = Pattern.compile(include);
        }

        public String getExclude() {
            return exclude;
        }

        public void setExclude(String exclude) {
            this.exclude = exclude;
            if (exclude != null && exclude.length() > 0)
                this.ePattern = Pattern.compile(exclude);
        }

        public boolean isMatched(String name) {
            boolean matches = true;

            if (iPattern != null)
                matches = iPattern.matcher(name).find();

            if (ePattern != null)
                matches &= !ePattern.matcher(name).find();

            return matches;
        }
    }
}
