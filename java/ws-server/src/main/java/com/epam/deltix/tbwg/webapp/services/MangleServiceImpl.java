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
package com.epam.deltix.tbwg.webapp.services;

import com.epam.deltix.util.io.IOUtil;
import org.springframework.stereotype.Service;

@Service
public class MangleServiceImpl implements MangleService {
    private static final String SUFFIX = "superKey";
    private static final String PREFIX = "EV";

    private MangleServiceImpl() {
    }

    @Override
    public String convertHashedValue(String value) {
        if (value == null)
            return null;

        return split(value);
    }

    private static String concat(String value) {
        return PREFIX + IOUtil.concat(value, SUFFIX);
    }

    private static String split(String value) {
        if (!isMangled(value))
            return value;

        value = value.substring(PREFIX.length());
        return IOUtil.split(value, SUFFIX);
    }

    private static boolean isMangled(String value) {
        return value.startsWith(PREFIX);
    }

    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("Specify string to mangle");
            return;
        }

        System.out.println(MangleServiceImpl.concat(args[0]));
    }
}
