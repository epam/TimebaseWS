/*
 * Copyright 2024 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.services.view.md;

import com.epam.deltix.tbwg.messages.ViewMetadataMessage;
import com.epam.deltix.tbwg.messages.ViewOutputType;
import com.epam.deltix.tbwg.messages.ViewQueryType;

public enum ViewMdUtils {
    INSTANCE;

    public MutableQueryViewMd newQueryViewInfo() {
        return new QueryViewMdImpl();
    }

    public ViewMd fromMessage(ViewMetadataMessage message) {
        QueryViewMdImpl viewMd = new QueryViewMdImpl();
        viewMd.setQuery(toString(message.getQuery()));
        viewMd.setId(toString(message.getSymbol()));
        viewMd.setTimestamp(message.getTimeStampMs());
        viewMd.setLastTimestamp(message.getLastTimestamp());
        viewMd.setStream(toString(message.getOutput()));
        viewMd.setLive(message.isLive());
        viewMd.setState(message.getState());
        viewMd.setDescription(toString(message.getDescription()));
        viewMd.setInfo(toString(message.getStatusMessage()));
        return viewMd;
    }

    public ViewMetadataMessage toMessage(ViewMd view) {
        ViewMetadataMessage message = new ViewMetadataMessage();
        message.setSymbol(view.getId());
        message.setOutput(view.getStream());
        message.setOutputType(ViewOutputType.STREAM);
        message.setLive(view.isLive());
        message.setAutoRestart(false);
        message.setState(view.getState());
        message.setDescription(view.getDescription());
        message.setLastTimestamp(view.getLastTimestamp());
        message.setStatusMessage(view.getInfo());
        message.setQueryType(ViewQueryType.QQL);
        if (view instanceof QueryViewMd) {
            message.setQuery(((QueryViewMd) view).getQuery());
        }

        return message;
    }

    private String toString(CharSequence cs) {
        return cs != null ? cs.toString() : "";
    }

}