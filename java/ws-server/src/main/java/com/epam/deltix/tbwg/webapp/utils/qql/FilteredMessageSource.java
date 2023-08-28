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

package com.epam.deltix.tbwg.webapp.utils.qql;

import com.epam.deltix.streaming.MessageSource;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.tickdb.pub.RawMessageHelper;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.util.lang.Util;

import java.util.Map;
import java.util.function.Predicate;

public class FilteredMessageSource implements MessageSource<InstrumentMessage> {

    private final InstrumentMessageSource delegate;
    private final Map<String, Predicate<String>> filters;

    private final RawMessageHelper helper = new RawMessageHelper();

    private InstrumentMessage current = null;
    private boolean atEnd = false;

    public FilteredMessageSource(InstrumentMessageSource delegate, Map<String, Predicate<String>> filters) {
        this.delegate = delegate;
        this.filters = filters;
    }

    @Override
    public InstrumentMessage getMessage() {
        return current;
    }

    @Override
    public boolean next() {
        while (delegate.next()) {
            RawMessage rawMessage = (RawMessage) delegate.getMessage();
            Map<String, Object> decoded = helper.getValues(rawMessage);
            if (matches(decoded)) {
                current = rawMessage;
                return true;
            }
        }
        atEnd = true;
        current = null;
        return false;
    }

    private boolean matches(Map<String, Object> msg) {
        for (Map.Entry<String, Predicate<String>> entry : filters.entrySet()) {
            Object value = msg.get(entry.getKey());
            if (value == null || !entry.getValue().test(value.toString())) {
                return false;
            }
        }
        return true;
    }

    @Override
    public boolean isAtEnd() {
        return atEnd;
    }

    @Override
    public void close() {
        Util.close(delegate);
    }
}
