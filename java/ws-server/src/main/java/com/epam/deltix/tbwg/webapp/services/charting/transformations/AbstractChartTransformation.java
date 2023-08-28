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

package com.epam.deltix.tbwg.webapp.services.charting.transformations;

import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.tbwg.webapp.services.charting.transformations.api.AbstractTransformation;

import java.util.ArrayList;
import java.util.List;

public abstract class AbstractChartTransformation<Downstream, Upstream> extends AbstractTransformation<Object, Object> {
    private final List<Class<?>> inputClasses;
    private final List<Class<?>> outputClasses;

    public AbstractChartTransformation(List<Class<? extends Upstream>> inputClasses, List<Class<? extends Downstream>> outputClasses) {
        this.inputClasses = new ArrayList<>(inputClasses);
        this.inputClasses.add(Message.class);
        this.outputClasses = new ArrayList<>(outputClasses);
        this.outputClasses.add(Message.class);
    }

    @Override
    public List<Class<?>> getInputClasses() {
        return inputClasses;
    }

    @Override
    public List<Class<?>> getOutputClasses() {
        return outputClasses;
    }

    @Override
    public final void onNext(Object o) {
        if (o instanceof Message) {
            onMessage((Message) o);
        } else {
            onNextPoint((Upstream) o);
        }
    }

    protected abstract void onMessage(final Message message);

    protected abstract void onNextPoint(final Upstream point);


}
