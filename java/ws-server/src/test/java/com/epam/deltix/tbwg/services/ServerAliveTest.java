package com.epam.deltix.tbwg.services;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.qsrv.hf.tickdb.pub.TickDBFactory;
import com.epam.deltix.tbwg.Application;
import com.epam.deltix.tbwg.utils.StreamGenerator;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import com.epam.deltix.util.io.IOUtil;
import com.epam.deltix.util.lang.Util;
import org.apache.commons.compress.archivers.ArchiveEntry;
import org.apache.commons.compress.archivers.ArchiveInputStream;
import org.apache.commons.compress.archivers.zip.ZipArchiveInputStream;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;

import javax.websocket.*;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.*;
import java.util.function.Consumer;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

/**
 * @author Daniil Yarmalkevich
 * Date: 8/20/2019
 */
@RunWith(SpringRunner.class)
@SpringBootTest(classes = Application.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("testWS")
@Ignore
public class ServerAliveTest {

    private static final Log LOGGER = LogFactory.getLog(ServerAliveTest.class);

    private static Path testDirectory;
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();
    private static final long TIMEOUT = 20000;
    private static DXTickDB db;
    private static Future<?> future;
    private static final int messagesNumber = 20;
    private static String subscribeMessage = "";

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @BeforeClass
    public static void beforeClass() throws Throwable {
//        SubscribeMessage message = new SubscribeMessage();
//        message.symbols.subscribeToAll = true;
//        Gson gson = new GsonBuilder().registerTypeAdapter(Instant.class, new InstantTypeAdapter()).create();
//        subscribeMessage = gson.toJson(message);
//
//        testDirectory = Files.createTempDirectory("test_ws");
//        String path = ServerAliveTest.class.getPackage().getName().replace('.', '/') + "/test_WS.zip";
//        unzipTestHome(new File(ServerAliveTest.class.getClassLoader().getResource(path).toURI()));
//        future = executor.submit(() -> {
//            try {
//                Home.set(testDirectory.toAbsolutePath().toString());
//                //QSHome.set(testDirectory.toAbsolutePath().toString());
//                TDBServerCmd.main(new String[]{
//                        "-db", testDirectory.resolve("tickdb").toAbsolutePath().toString(),
//                        "-port", "5453"});
//            } catch (Throwable throwable) {
//                throw new RuntimeException(throwable);
//            }
//        });
        db = waitTillTimebaseIsUp();
        StreamGenerator.loadBars(messagesNumber, "test", db);
    }

    private static DXTickDB waitTillTimebaseIsUp() {
        final long start = System.currentTimeMillis();
        while (System.currentTimeMillis() - start <= TIMEOUT) {
            try {
                DXTickDB db = TickDBFactory.createFromUrl("dxtick://localhost:5453");
                db.open(false);
                return db;
            } catch (Throwable ignore) {
            }
        }
        throw new RuntimeException("Cannot connect to TimeBase");
    }

    @Test
    public void testRestAPI() {
        ResponseEntity<String> testStream = restTemplate.getForEntity("/api/v0/test/select", String.class);
        assertEquals(testStream.getStatusCode(), HttpStatus.OK);
        assertNotNull(testStream.getBody());

        ResponseEntity<String> streams = restTemplate.getForEntity("/api/v0/streams", String.class);
        assertEquals(streams.getStatusCode(), HttpStatus.OK);
        assertNotNull(streams.getBody());
    }

    @Test
    public void testWebSocket() throws URISyntaxException, IOException, DeploymentException, InterruptedException {
        ResponseEntity<String> testStream = restTemplate.getForEntity("/api/v0/test/select", String.class);
        assertEquals(testStream.getStatusCode(), HttpStatus.OK);
        assertNotNull(testStream.getBody());

        WebSocketContainer container = ContainerProvider.getWebSocketContainer();
        Aggregator aggregator = new Aggregator();
        TestClient client = new TestClient(aggregator);
        Session session = container.connectToServer(client, getWsUri(false));
        assertNotNull(session);
        client.latch.await(5, TimeUnit.SECONDS);
        assertEquals(1, aggregator.messages.size());
        assertEquals(testStream.getBody(), aggregator.messages.get(0));
    }

    @Test
    public void testLiveWebSocket() throws URISyntaxException, IOException, DeploymentException, InterruptedException {
        WebSocketContainer container = ContainerProvider.getWebSocketContainer();
        Counter counter = new Counter();
        TestClient client = new TestClient(counter);
        Session session = null;
        try {
            session = container.connectToServer(client, getWsUri(true));
            assertNotNull(session);
            client.latch.await(5, TimeUnit.SECONDS);
            assertEquals(messagesNumber, counter.count);
        } finally {
            Util.close(session);
        }

    }

    @AfterClass
    public static void afterClass() throws InterruptedException, IOException {
        db.getStream("test").delete();
        db.close();
        future.cancel(true);
        executor.shutdownNow();
        FileUtils.deleteQuietly(testDirectory.toFile());
    }

    private String getWsURL(boolean live) {
        return live ? String.format("ws://localhost:%d/ws/v0/test/select?live=true", port):
                String.format("ws://localhost:%d/ws/v0/test/select", port);
    }

    private URI getWsUri(boolean live) throws URISyntaxException {
        return new URI(getWsURL(live));
    }

    public static void unzipTestHome(File zip) throws IOException {
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

    @ClientEndpoint
    public class TestClient {

        private final Consumer<String> consumer;
        private final CountDownLatch latch = new CountDownLatch(1);

        public TestClient(Consumer<String> consumer) {
            this.consumer = consumer;
        }

        @OnOpen
        public void onOpen(Session session) throws IOException {
            LOGGER.info("%s opened session %s")
                    .with(TestClient.class.getSimpleName())
                    .with(session.getId());
            session.getBasicRemote().sendText(subscribeMessage);
        }

        @OnMessage
        public void onMessage(String message, Session session) {
            if (consumer != null) {
                consumer.accept(message);
            }
        }

        @OnClose
        public void onClose(Session session, CloseReason closeReason) {
            latch.countDown();
            LOGGER.info("%s closed session %s due to reason %s")
                    .with(TestClient.class.getSimpleName())
                    .with(session.getId())
                    .with(closeReason.getReasonPhrase());
        }
    }

    public class Aggregator implements Consumer<String> {
        List<String> messages = new ObjectArrayList<>();

        @Override
        public void accept(String s) {
            LOGGER.info("%s got message %s")
                    .with(Aggregator.class.getSimpleName())
                    .with(s);
            messages.add(s);
        }
    }

    public class Counter implements Consumer<String> {
        private int count = 0;

        @Override
        public void accept(String s) {
            LOGGER.info("%s got message %s")
                    .with(Aggregator.class.getSimpleName())
                    .with(s);
            count++;
        }
    }

}
