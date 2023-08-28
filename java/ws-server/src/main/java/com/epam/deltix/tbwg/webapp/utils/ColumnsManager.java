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

package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.tbwg.webapp.model.schema.TypeDef;
import com.epam.deltix.timebase.messages.universal.PackageHeader;

/**
 * Created by Alex Karpovich on 21/08/2019.
 */
public class ColumnsManager {

    public static void applyDefaults(TypeDef type) {

        if (PackageHeader.CLASS_NAME.equals(type.getName())) {
            for (int i = 0; i < type.getFields().length; i++)
                type.getFields()[i].setHidden(true);

            type.setVisible("packageType");
            type.setVisible("entries");
        }
    }
}
