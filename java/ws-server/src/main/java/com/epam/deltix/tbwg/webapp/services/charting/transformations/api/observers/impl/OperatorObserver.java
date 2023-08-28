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
package com.epam.deltix.tbwg.webapp.services.charting.transformations.api.observers.impl;

import io.reactivex.Observer;
import io.reactivex.disposables.Disposable;

public abstract class OperatorObserver<Downstream, Upstream> implements Observer<Upstream>, Disposable {
    final protected Observer<? super Downstream> downstream;
    private Disposable upstream;

    public OperatorObserver(final Observer<? super Downstream> downstream) {
        this.downstream = downstream;
    }

    @Override
    final public void onSubscribe(Disposable d) {
        if (upstream != null) {
            d.dispose();
        } else {
            upstream = d;
            downstream.onSubscribe(this);
            onStart();
        }
    }

    protected void onStart() {
    }

    @Override
    public void onError(Throwable e) {
        downstream.onError(e);
    }

    @Override
    final public void dispose() {
        upstream.dispose();
    }

    @Override
    final public boolean isDisposed() {
        return upstream.isDisposed();
    }
}