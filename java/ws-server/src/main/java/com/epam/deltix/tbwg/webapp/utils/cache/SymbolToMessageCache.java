/*
 * Copyright 2021 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.utils.cache;

import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.util.json.JSONRawMessagePrinter;
import com.epam.deltix.util.collections.CharSequenceToObjectMap;

import java.util.ArrayList;
import java.util.List;

public class SymbolToMessageCache {

    private static class MessageHolder<T extends InstrumentMessage> {
        private final T message;
        private boolean dirty;

        private MessageHolder(T message) {
            this.message = message;
        }

        private T getMessage() {
            return message;
        }

        private boolean isDirty() {
             return dirty;
        }

        private void setDirty(boolean dirty) {
            this.dirty = dirty;
        }
    }

    private final CharSequenceToObjectMap<MessageHolder<RawMessage>> cache = new CharSequenceToObjectMap<>();
    private final List<MessageHolder<RawMessage>> toFlush = new ArrayList<>();
    private final StringBuilder buffer = new StringBuilder();

    public synchronized void add(RawMessage message) {
        MessageHolder<RawMessage> messageHolder = cache.get(message.getSymbol());
        if (messageHolder == null) {
            cache.put(message.getSymbol(), messageHolder = new MessageHolder<>(new RawMessage()));
        }

        if (!messageHolder.isDirty()) {
            toFlush.add(messageHolder);
        }
        messageHolder.getMessage().copyFrom(message);
        messageHolder.setDirty(true);
    }

    public synchronized String print(JSONRawMessagePrinter printer) {
        int count = toFlush.size();
        buffer.setLength(0);

        if (count > 0) {
            buffer.append("[");

            for (int i = 0; i < count; ++i) {
                if (buffer.length() > 1)
                    buffer.append(",");
                MessageHolder<RawMessage> holder = toFlush.get(i);
                printer.append(holder.getMessage(), buffer);
                holder.setDirty(false);
            }
            toFlush.clear();

            buffer.append("]");
        }

        return buffer.toString();
    }

    public synchronized void clear() {
        cache.clear();
        toFlush.clear();
    }
}
