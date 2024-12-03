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
package com.epam.deltix.tbwg.webapp.utils;

public class VersionUtils {


    public static boolean versionHasNsEncoding(String serverVersion) {
        if (serverVersion != null) {
            int majorVersion = Integer.parseInt(serverVersion.substring(0, serverVersion.indexOf('.')));
            if (majorVersion < 5) {
                return false;
            } else if (majorVersion > 5) {
                return true;
            } else {
                int midlVersion = Integer.parseInt(serverVersion.substring(serverVersion.indexOf('.') + 1, serverVersion.lastIndexOf('.')));
                if (midlVersion < 6) {
                    return false;
                } else if (midlVersion > 6) {
                    return true;
                } else {
                    int endIndex = serverVersion.indexOf('-');
                    endIndex = endIndex > 0 ? endIndex : serverVersion.length();
                    int minorVersion = Integer.parseInt(serverVersion.substring(serverVersion.lastIndexOf('.') + 1, endIndex));
                    return minorVersion >= 58;
                }
            }
        }
        return false;
    }


    public static boolean versionHasRecord(String serverVersion) {
        if (serverVersion != null) {
            int majorVersion = Integer.parseInt(serverVersion.substring(0, serverVersion.indexOf('.')));
            if (majorVersion < 5) {
                return false;
            } else if (majorVersion > 5) {
                return true;
            } else {
                int midlVersion = Integer.parseInt(serverVersion.substring(serverVersion.indexOf('.') + 1, serverVersion.lastIndexOf('.')));
                if (midlVersion < 5) {
                    return false;
                } else if (midlVersion > 6) {
                    return true;
                } else {
                    int endIndex = serverVersion.indexOf('-');
                    endIndex = endIndex > 0 ? endIndex : serverVersion.length();
                    int minorVersion = Integer.parseInt(serverVersion.substring(serverVersion.lastIndexOf('.') + 1, endIndex));
                    if (midlVersion == 5) {
                        if (minorVersion >= 77) {
                            return true;
                        } else throw new RuntimeException("Timebase server is outdated, update to the latest version");
                    } else {
                        if (minorVersion >= 24) {
                            return true;
                        } else throw new RuntimeException("Timebase server is outdated, update to the latest version");
                    }
                }
            }
        }
        return false;
    }

}