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
package com.epam.deltix.tbwg.webapp.services.charting.transformations;

import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.util.json.JSONRawMessagePrinter;
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.tbwg.webapp.model.charting.line.RawElementDef;

import java.util.Collections;

public class QqlConversionTransformation extends AbstractChartTransformation<RawElementDef, RawMessage> {

    private final StringBuilder sb = new StringBuilder();
    private final JSONRawMessagePrinter rawMessagePrinter = new JSONRawMessagePrinter();

    public QqlConversionTransformation() {
        super(Collections.singletonList(RawMessage.class), Collections.singletonList(RawElementDef.class));
    }

    @Override
    protected void onMessage(Message message) {
        sendMessage(message);
    }

    @Override
    protected void onNextPoint(RawMessage barMessage) {
        sb.setLength(0);
        rawMessagePrinter.append(barMessage, sb);
        RawElementDef rawPoint = new RawElementDef(sb.toString());
        rawPoint.setTime(barMessage.getTimeStampMs());
        sendMessage(rawPoint);
    }

}
