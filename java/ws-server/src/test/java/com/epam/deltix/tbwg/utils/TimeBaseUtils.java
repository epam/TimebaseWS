package com.epam.deltix.tbwg.utils;

import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.qsrv.hf.tickdb.pub.TickDBFactory;
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

public class TimeBaseUtils {

    private static final String SERIAL = "***";

//    public static Future<?> startTimeBase(Path testDirectory, ExecutorService executor) throws Throwable {
//        String path = ServerAliveTest.class.getPackage().getName().replace('.', '/') + "/test_WS.zip";
//        unzipTestHome(new File(ServerAliveTest.class.getClassLoader().getResource(path).toURI()), testDirectory);
//
//        File instFile = new File(testDirectory.toString(), "inst.properties");
//        FileWriter writer = new FileWriter(instFile.getAbsolutePath());
//        writer.write("serial=" + SERIAL);
//        writer.close();
//
//        return executor.submit(() -> {
//            try {
//                Home.set(testDirectory.toAbsolutePath().toString());
//                //QSHome.set(testDirectory.toAbsolutePath().toString());
//                TDBServerCmd.main(new String[]{
//                    "-db", testDirectory.resolve("tickdb").toAbsolutePath().toString(),
//                    "-port", "5453"});
//            } catch (Throwable throwable) {
//                throw new RuntimeException(throwable);
//            }
//        });
//    }

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
