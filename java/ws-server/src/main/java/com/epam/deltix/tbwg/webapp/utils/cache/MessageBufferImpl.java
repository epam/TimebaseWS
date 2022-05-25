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

import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.util.json.JSONRawMessagePrinter;

public class MessageBufferImpl implements MessageBuffer<RawMessage> {
    private final JSONRawMessagePrinter printer;
    private final StringBuilder buffer = new StringBuilder("[");
    private final boolean live;

    public MessageBufferImpl(JSONRawMessagePrinter printer, boolean live) {
        this.printer = printer;
        this.live = live;
    }

    @Override
    public void append(RawMessage message) {
        if (buffer.length() > 1)
            buffer.append(",");

        printer.append(message, buffer);
    }

    @Override
    public boolean canFlush() {
        return buffer.length() >= LIMIT_BUFFER_SIZE || live;
    }

    @Override
    public void clear() {
    }

    @Override
    public String flush() {
        if (buffer.length() > 1) {
            buffer.append("]");
        }
        String result = buffer.toString();
        buffer.setLength(0);
        buffer.append("[");

        return result;
    }
}
