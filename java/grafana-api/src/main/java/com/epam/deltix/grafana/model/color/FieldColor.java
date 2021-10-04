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
package com.epam.deltix.grafana.model.color;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class FieldColor {
    @Nonnull
    protected FieldColorMode mode;

    @Nullable
    protected ColorScheme schemeName;

    @Nullable
    protected String fixedColor;

    public FieldColor(@Nonnull FieldColorMode mode, @Nullable ColorScheme schemeName, @Nullable String fixedColor) {
        this.mode = mode;
        this.schemeName = schemeName;
        this.fixedColor = fixedColor;
    }

    @Nonnull
    public FieldColorMode getMode() {
        return mode;
    }

    public void setMode(@Nonnull FieldColorMode mode) {
        this.mode = mode;
    }

    @Nullable
    public ColorScheme getSchemeName() {
        return schemeName;
    }

    public void setSchemeName(@Nullable ColorScheme schemeName) {
        this.schemeName = schemeName;
    }

    @Nullable
    public String getFixedColor() {
        return fixedColor;
    }

    public void setFixedColor(@Nullable String fixedColor) {
        this.fixedColor = fixedColor;
    }
}
