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

import com.epam.deltix.qsrv.hf.pub.MappingTypeLoader;
import com.epam.deltix.qsrv.hf.pub.TypeLoader;
import com.epam.deltix.qsrv.hf.pub.TypeLoaderImpl;
import com.epam.deltix.qsrv.hf.pub.md.ClassDescriptor;
import com.epam.deltix.tbwg.messages.BarMessage;
import com.epam.deltix.timebase.messages.universal.*;

/**
 * Default Type Loader to support different types
 */
public class DefaultTypeLoader extends MappingTypeLoader {

    public DefaultTypeLoader () {
        this (TypeLoaderImpl.DEFAULT_INSTANCE);
    }

    public DefaultTypeLoader (TypeLoader parent) {
        super (parent);

        bind("deltix.timebase.api.messages.BarMessage", BarMessage.class);
        bind("com.epam.deltix.timebase.messages.BarMessage", BarMessage.class);

        bind("deltix.timebase.api.messages.universal.PackageHeader", PackageHeader.class);
        bind("deltix.timebase.api.messages.universal.L1Entry", L1Entry.class);
        bind("deltix.timebase.api.messages.universal.L2EntryNew", L2EntryNew.class);
        bind("deltix.timebase.api.messages.universal.TradeEntry", TradeEntry.class);
        bind("deltix.timebase.api.messages.universal.L2EntryUpdate", L2EntryUpdate.class);
        bind("deltix.timebase.api.messages.universal.L3EntryNew", L3EntryNew.class);
        bind("deltix.timebase.api.messages.universal.L3EntryUpdate", L3EntryUpdate.class);
        bind("deltix.timebase.api.messages.universal.BookResetEntry", BookResetEntry.class);
        bind("deltix.timebase.api.messages.universal.StatisticsEntry", StatisticsEntry.class);
    }

    @Override
    public synchronized Class<?> load(ClassDescriptor cd) throws ClassNotFoundException {
        String name = cd.getName();

        Class <?>       cls = map.get (name);
        if (cls != null)
            return (cls);

        if (name.endsWith("BarMessage"))
            return BarMessage.class;

        if (name.endsWith("PackageHeader"))
            return PackageHeader.class;

        return super.load(cd);
    }
}
