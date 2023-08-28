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

import java.nio.file.Paths;
import java.util.Properties;

/**
 * Created by Alex Karpovich on 7/18/2018.
 */
public class SimpleArgsParser {

    public static Properties process(String[] args) {
        return process(args, "-");
    }

    public static Properties process(String[] args, String namePrefix) {

        Properties props = new Properties();

        for (int i = 0; i < args.length; i++) {
            String arg = args[i];

            if (arg.startsWith(namePrefix)) {
                if (++i == args.length)
                    throw new IllegalArgumentException("Undefined value for name: " + arg);
                props.put(arg, args[i]);
            }
        }

        return props;
    }
}
