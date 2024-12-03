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
package com.epam.deltix.tbwg.webapp.services.charting.provider;

import com.epam.deltix.qsrv.hf.pub.md.ClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.tbwg.webapp.model.ModelDataSourceType;

import java.util.HashSet;
import java.util.Set;

public interface ChartQueryGenerator {

    String generateL2PricesQuery();

    String generateBboQuery();

    String generateBarQuery();

    static String buildSymbolsFilter(String[] symbols) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < symbols.length; i++) {
            sb.append("symbol == '").append(symbols[i]).append("'");
            if (i < symbols.length - 1) {
                sb.append(" or ");
            }
        }
        return sb.toString();
    }

    static String buildTypeFilter(Set<String> types) {
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (String type : types) {
            if (!first) {
                sb.append(" or ");
            } else {
                first = false;
            }

            sb.append("this is \"").append(type).append("\"");
        }

        return sb.toString();
    }

    static String buildEntriesLevelFilter(ModelDataSourceType dataSourceType, int levelCount) {
        if (dataSourceType == ModelDataSourceType.L1) {
            return "[level < 1]";
        } else if (dataSourceType == ModelDataSourceType.L2) {
            return "[level < " + levelCount + "]";
        }
        return "";
    }

    static boolean containsClassName(RecordClassDescriptor[] descriptors, String className) {
        for (RecordClassDescriptor descriptor : descriptors) {
            if (descriptor.getName().equalsIgnoreCase(className)) {
                return true;
            }
        }

        return false;
    }

    static Set<String> findDerivedTypes(RecordClassSet rcs, String... names) {
        Set<String> result = new HashSet<>();

        for (String name : names) {
            ClassDescriptor[] descriptors = rcs.getClasses();
            for (ClassDescriptor descriptor : descriptors) {
                if (descriptor instanceof RecordClassDescriptor) {
                    RecordClassDescriptor rcd = (RecordClassDescriptor) descriptor;
                    if (hasDerivedType(rcd, name)) {
                        result.add(rcd.getName());
                    }
                }
            }
        }

        return result;
    }

    static boolean hasDerivedType(RecordClassDescriptor rcd, String className) {
        do {
            if (rcd.getName().equalsIgnoreCase(className)) {
                return true;
            }

            rcd = rcd.getParent();
        } while (rcd != null);

        return false;
    }
}