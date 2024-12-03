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
package com.epam.deltix.tbwg.webapp.services.timebase.connections;

import java.util.Objects;

public class TbUser {

    private final String name;
    private final String token;

    protected TbUser(String name, String token) {
        this.name = name;
        this.token = token;
    }

    public static TbUser create(String name, String token) {
        return new TbUser(name, token);
    }

    public String getName() {
        return name;
    }

    public String getToken() {
        return token;
    }

    @Override
    public String toString() {
        return name;
    }

    // use only username
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TbUser tbUser = (TbUser) o;
        return Objects.equals(name, tbUser.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name);
    }
}