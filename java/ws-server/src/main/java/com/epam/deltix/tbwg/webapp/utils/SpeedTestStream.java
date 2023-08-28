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

import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.qsrv.hf.pub.md.Introspector;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;

import java.util.Arrays;
import java.util.Properties;
import java.util.Random;

public class SpeedTestStream {

    public static DXTickStream createSpeedTestStream(DXTickDB db, String name) {
        DXTickStream stream = db.getStream(name);
        if (stream == null) {
            try {
                StreamOptions options = new StreamOptions(StreamScope.DURABLE,
                        name,
                        "Description \nStream created for TimebaseWS speed-test",
                        0);
                Introspector.introspectSingleClass(PackageHeader.class);
                options.setFixedType((RecordClassDescriptor) Introspector.introspectSingleClass(PackageHeader.class));
                stream = db.createStream(name, options);
            } catch (Introspector.IntrospectionException exc) {
                throw new RuntimeException(exc.getCause());
            }
        }
        return stream;
    }

    @SuppressFBWarnings("PREDICTABLE_RANDOM")
    public static void loadData(DXTickStream stream, String name, long messages) {

        PackageHeader header = new PackageHeader();
        ObjectArrayList<BaseEntryInfo> list = new ObjectArrayList<>();
        ObjectArrayList<BaseEntryInfo> snapshotList = new ObjectArrayList<>();
        L2EntryNew[] l2EntriesBID = new L2EntryNew[20];
        L2EntryNew[] l2EntriesASK = new L2EntryNew[20];
        for (int i = 0; i < 20; i++) {
            l2EntriesBID[i] = new L2EntryNew();
            l2EntriesBID[i].setLevel((short) i);
            l2EntriesBID[i].setSide(QuoteSide.BID);
            l2EntriesBID[i].setQuoteId("HEJ");

            l2EntriesASK[i] = new L2EntryNew();
            l2EntriesASK[i].setLevel((short) i);
            l2EntriesASK[i].setSide(QuoteSide.ASK);
            l2EntriesASK[i].setQuoteId("HEJ");
        }
        snapshotList.addAll(Arrays.asList(l2EntriesASK));
        snapshotList.addAll(Arrays.asList(l2EntriesBID));
        L2EntryNew l2EntryNew = new L2EntryNew();
        L2EntryUpdate l2EntryUpdate = new L2EntryUpdate();
        l2EntryNew.setQuoteId("HEJ");
        l2EntryNew.setSide(QuoteSide.BID);
        l2EntryUpdate.setQuoteId("HEJ");
        l2EntryUpdate.setSide(QuoteSide.BID);
        list.add(l2EntryNew);
        list.add(l2EntryUpdate);

        TickLoader loader = stream.createLoader();

        LoadingErrorListener listener = e -> System.out.println("Importing error: " + e.getMessage());
        loader.addEventListener(listener);

        String[] symbols = new String[]{"AAA", "BBB", "CCC", "DDD", "EEE"};
        Random random = new Random(System.currentTimeMillis());

        long time = System.currentTimeMillis() - 10 * messages;
        for (long i = 1; i <= messages; i++, time+=10) {
            header.setSymbol(symbols[random.nextInt(symbols.length)]);
            header.setTimeStampMs(time);
            if (i % 42 == 0) {
                header.setEntries(snapshotList);
                header.setPackageType(PackageType.VENDOR_SNAPSHOT);
                for (int j = 0; j < 20; j++) {
                    l2EntriesBID[j].setIsImplied(false);
                    l2EntriesBID[j].setPrice(Decimal64Utils.fromDouble((1. + random.nextDouble()) * 1000));
                    l2EntriesBID[j].setSize(Decimal64Utils.fromDouble((1. + random.nextDouble()) * 1000));

                    l2EntriesASK[j].setIsImplied(false);
                    l2EntriesASK[j].setPrice(Decimal64Utils.fromDouble((1. + random.nextDouble()) * 1000));
                    l2EntriesASK[j].setSize(Decimal64Utils.fromDouble((1. + random.nextDouble()) * 1000));
                }
            } else {
                header.setEntries(list);
                header.setPackageType(PackageType.INCREMENTAL_UPDATE);

                l2EntryNew.setLevel((short) random.nextInt(20));
                l2EntryNew.setPrice(Decimal64Utils.fromDouble((1. + random.nextDouble()) * 1000));
                l2EntryNew.setSize(Decimal64Utils.fromDouble((1. + random.nextDouble()) * 1000));

                l2EntryUpdate.setLevel((short) random.nextInt(20));
                l2EntryUpdate.setPrice(Decimal64Utils.fromDouble((1. + random.nextDouble()) * 1000));
                l2EntryUpdate.setSize(Decimal64Utils.fromDouble((1. + random.nextDouble()) * 1000));
                l2EntryUpdate.setAction(BookUpdateAction.DELETE);
            }

            loader.send(header);
        }

        loader.close();
    }

    public static void main(String[] args) {
        Properties values = SimpleArgsParser.process(args);
        String url = values.getProperty("-url", "dxtick://localhost:8011");
        String streamName = values.getProperty("-stream", "speed.test.stream");
        long messages = Long.parseLong(values.getProperty("-messages", "10000000"));
        DXTickDB db = TickDBFactory.createFromUrl(url);
        db.open(false);
        try {
            DXTickStream stream = createSpeedTestStream(db, streamName);
            loadData(stream, streamName, messages);
        } finally {
            db.close();
        }
    }
}

