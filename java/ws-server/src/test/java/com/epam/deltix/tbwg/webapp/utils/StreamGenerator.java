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
package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.qsrv.hf.pub.md.Introspector;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.tbwg.messages.BarMessage;

import java.util.Random;

/**
 * @author Daniil Yarmalkevich
 * Date: 8/19/2019
 */
public class StreamGenerator {

    private static final Random RANDOM = new Random(System.currentTimeMillis());

    public static void main(String[] args) {
        try (DXTickDB db = TickDBFactory.createFromUrl("dxtick://localhost:8011")) {
            db.open(false);
            loadBars(10000, "garafana", db);
        } catch (Introspector.IntrospectionException e) {
            e.printStackTrace();
        }
    }

    public static RecordClassDescriptor mkBarMessageDescriptor() throws Introspector.IntrospectionException {
        return Introspector.createEmptyMessageIntrospector().introspectRecordClass(BarMessage.class);
    }

    public static void loadBars(int total, String key, DXTickDB db) throws Introspector.IntrospectionException {

        DXTickStream stream = db.getStream(key);
        if (stream == null) {
            StreamOptions options = new StreamOptions (StreamScope.DURABLE, key, null, 0);
            options.setFixedType(mkBarMessageDescriptor());
            stream = db.createStream(options.name, options);
        } else {
            stream.clear();
        }

        long interval = 1000;
        long timestamp = System.currentTimeMillis() - total * interval;

        double price = 9000.;

        try (TickLoader loader = stream.createLoader()) {
            for (int i = 0; i < total; i++) {
                loader.send(createBar(price, timestamp += interval, getSymbol()));
            }
        }
    }

    private static String getSymbol(String ... symbols) {
        if (symbols.length == 0) {
            return "TEST";
        }
        return symbols[RANDOM.nextInt(symbols.length)];
    }

    public static void loadBarsLive(long interval, int total, String key, DXTickDB db, String ... symbols) throws Introspector.IntrospectionException {
        DXTickStream stream = db.getStream(key);
        if (stream == null) {
            StreamOptions options = new StreamOptions (StreamScope.DURABLE, key, null, 0);
            options.setFixedType(mkBarMessageDescriptor());
            stream = db.createStream(options.name, options);
        }

        double price = 9000.;

        try (TickLoader loader = stream.createLoader()) {
            for (int i = 0; i < total; i++) {
                long time = System.currentTimeMillis();
                loader.send(createBar(price, time, getSymbol(symbols)));
                try {
                    Thread.sleep(interval);
                } catch (InterruptedException ignored) {
                }
            }
        }
    }

    public static BarMessage createBar(double price, long timestamp, String symbol) {
        BarMessage barMessage = new BarMessage();
        barMessage.setSymbol(symbol);
        barMessage.setTimeStampMs(timestamp);

        barMessage.setExchangeId(1);

        double d1 = RANDOM.nextDouble() * 100;
        double d2 = d1 / 2;
        barMessage.setHigh(price + d1);
        barMessage.setLow(price - d1);
        if (RANDOM.nextBoolean()) {
            barMessage.setOpen(price + d2);
            barMessage.setClose(price - d2);
        } else {
            barMessage.setOpen(price - d2);
            barMessage.setClose(price + d2);
        }
        barMessage.setVolume(RANDOM.nextDouble() * 1000);
        return barMessage;
    }

}
