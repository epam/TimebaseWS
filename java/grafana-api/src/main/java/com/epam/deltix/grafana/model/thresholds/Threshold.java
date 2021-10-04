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
package com.epam.deltix.grafana.model.thresholds;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class Threshold {

    protected double number;

    @Nonnull
    protected String color;

    @Nullable
    protected State state;

    public Threshold(double number, @Nonnull String color, @Nullable State state) {
        this.number = number;
        this.color = color;
        this.state = state;
    }

    public double getNumber() {
        return number;
    }

    public void setNumber(double number) {
        this.number = number;
    }

    @Nonnull
    public String getColor() {
        return color;
    }

    public void setColor(@Nonnull String color) {
        this.color = color;
    }

    @Nullable
    public State getState() {
        return state;
    }

    public void setState(@Nullable State state) {
        this.state = state;
    }
}
