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
package com.epam.deltix.tbwg.webapp.services.view.md;

import com.epam.deltix.tbwg.messages.QueryViewMdMessage;
import com.epam.deltix.tbwg.messages.ViewMdMessage;
import org.modelmapper.ModelMapper;

public enum ViewMdUtils {
    INSTANCE;

    private final ModelMapper modelMapper = new ModelMapper();

    public MutableQueryViewMd newQueryViewInfo() {
        return new QueryViewMdImpl();
    }

    public ViewMd fromMessage(ViewMdMessage message) {
        if (message instanceof QueryViewMdMessage) {
            return modelMapper.map(message, QueryViewMdImpl.class);
        }

        return null;
    }

    public ViewMdMessage toMessage(ViewMd view) {
        if (view instanceof QueryViewMdImpl) {
            return modelMapper.map(view, QueryViewMdMessage.class);
        }

        return null;
    }

}
