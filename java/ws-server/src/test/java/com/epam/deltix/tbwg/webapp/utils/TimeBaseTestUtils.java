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

import com.epam.deltix.tbwg.webapp.services.ServerAliveTest;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.qsrv.hf.tickdb.pub.TickDBFactory;
import com.epam.deltix.util.io.Home;
import com.epam.deltix.util.io.IOUtil;
import org.apache.commons.compress.archivers.ArchiveEntry;
import org.apache.commons.compress.archivers.ArchiveInputStream;
import org.apache.commons.compress.archivers.zip.ZipArchiveInputStream;
import org.apache.commons.io.IOUtils;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;

public class TimeBaseTestUtils {

    private static final String SERIAL = System.getenv("TIMEBASE_SERIAL");

    public static Future<?> startTimeBase(Path testDirectory, ExecutorService executor) throws Throwable {
        String path = ServerAliveTest.class.getPackage().getName().replace('.', '/') + "/test_WS.zip";
        unzipTestHome(new File(ServerAliveTest.class.getClassLoader().getResource(path).toURI()), testDirectory);

        File instFile = new File(testDirectory.toString(), "inst.properties");
        FileWriter writer = new FileWriter(instFile.getAbsolutePath());
        writer.write("serial=" + SERIAL);
        writer.close();

        return executor.submit(() -> {
            try {
                Home.set(testDirectory.toAbsolutePath().toString());
                throw new UnsupportedOperationException();
//                QSHome.set(testDirectory.toAbsolutePath().toString());
//                TDBServerCmd.main(new String[]{
//                    "-db", testDirectory.resolve("tickdb").toAbsolutePath().toString(),
//                    "-port", "5453"});
            } catch (Throwable throwable) {
                throw new RuntimeException(throwable);
            }
        });
    }

    public static DXTickDB waitTillTimebaseIsUp(long timeout) {
        final long start = System.currentTimeMillis();
        while (System.currentTimeMillis() - start <= timeout) {
            try {
                DXTickDB db = TickDBFactory.createFromUrl("dxtick://localhost:5453");
                db.open(false);
                return db;
            } catch (Throwable ignore) {
            }
        }
        throw new RuntimeException("Cannot connect to TimeBase");
    }

    private static void unzipTestHome(File zip, Path testDirectory) throws IOException {
        IOUtil.mkDirIfNeeded(testDirectory.toFile());
        try (ArchiveInputStream i = new ZipArchiveInputStream(new FileInputStream(zip))) {
            ArchiveEntry entry;
            while ((entry = i.getNextEntry()) != null) {
                File f = testDirectory.resolve(entry.getName()).toFile();
                if (entry.isDirectory()) {
                    IOUtil.mkDirIfNeeded(f);
                } else {
                    File parent = f.getParentFile();
                    if (!parent.isDirectory() && !parent.mkdirs()) {
                        throw new IOException("failed to create directory " + parent);
                    }
                    try (OutputStream o = Files.newOutputStream(f.toPath())) {
                        IOUtils.copy(i, o);
                    }
                }
            }
        }
    }
}
