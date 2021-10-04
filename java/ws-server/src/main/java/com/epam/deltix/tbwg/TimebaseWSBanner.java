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
package com.epam.deltix.tbwg;

import org.springframework.boot.Banner;
import org.springframework.core.env.Environment;

import java.io.PrintStream;

public class TimebaseWSBanner implements Banner {
    @Override
    public void printBanner(Environment environment, Class<?> sourceClass, PrintStream out) {
        out.append("\n" +
                " _______  _                ______                          ______                                          \n" +
                        "(_______)(_)              (____  \\                        / _____)        _                                \n" +
                        " _        _  ____    ____  ____)  )  ____   ___   ____   | /  ___   ____ | |_    ____  _ _ _   ____  _   _ \n" +
                        "| |      | ||    \\  / _  )|  __  (  / _  | /___) / _  )  | | (___) / _  ||  _)  / _  )| | | | / _  || | | |\n" +
                        "| |_____ | || | | |( (/ / | |__)  )( ( | ||___ |( (/ /   | \\____/|( ( | || |__ ( (/ / | | | |( ( | || |_| |\n" +
                        " \\______)|_||_|_|_| \\____)|______/  \\_||_|(___/  \\____)   \\_____/  \\_||_| \\___) \\____) \\____| \\_||_| \\__  |\n" +
                        "                                                                                                    (____/ "
        );
    }
}
