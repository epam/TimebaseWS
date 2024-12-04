package com.epam.deltix.tbwg.webapp.services;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.Introspector;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.tbwg.webapp.Application;
import com.epam.deltix.tbwg.webapp.model.input.QueryRequest;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.utils.StreamGenerator;
import com.epam.deltix.tbwg.webapp.utils.TokenUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.IOException;
import java.util.UUID;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = Application.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles({"testApiKeys", "withTb", "timebaseExternal"})
@Testcontainers
public class TestTimebaseController {

    private static final Log LOGGER = LogFactory.getLog(TestTimebaseController.class);

    private static final int messagesNumber = 20;
    public static final String STREAM_KEY = UUID.randomUUID().toString();

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private TimebaseService timebaseService;
    private DXTickDB db;

    @Before
    public void beforeTest() throws Introspector.IntrospectionException {
        db = timebaseService.getConnection();
        StreamGenerator.loadBars(messagesNumber, STREAM_KEY, db);
    }

    @After
    public void afterTest() {
        DXTickStream stream = db.getStream(STREAM_KEY);
        if (stream != null) {
            stream.delete();
        }
        db.close();
        db = null;
    }

    @Test
    public void testSmokeQuery() throws IOException {
        String token = TokenUtils.requestToken(restTemplate.getRestTemplate(), "admin", "admin");
        ResponseEntity<String> result = sendQueryRequest(token, "select * from \"" + STREAM_KEY + "\"");
        Assert.assertEquals(200, result.getStatusCode().value());
    }

    @Test
    public void testSmokeDdlQuery() throws IOException {
        String token = TokenUtils.requestToken(restTemplate.getRestTemplate(), "admin", "admin");
        ResponseEntity<String> result = sendQueryRequest(token, "drop stream \"" + STREAM_KEY + "\"");
        Assert.assertEquals(200, result.getStatusCode().value());
    }

    @Test
    public void testForbiddenDdlQuery() throws IOException {
        String token = TokenUtils.requestToken(restTemplate.getRestTemplate(), "reader", "reader");
        ResponseEntity<String> result = sendQueryRequest(token, "drop stream \"" + STREAM_KEY + "\"");
        Assert.assertEquals(403, result.getStatusCode().value());
    }

    private void removeStream(String streamKey) {
        DXTickStream stream = db.getStream(streamKey);
        if (stream != null) {
            stream.delete();
        }
    }

    private ResponseEntity<String> sendQueryRequest(String token, String query) throws JsonProcessingException {
        QueryRequest request = new QueryRequest();
        request.query = query;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        headers.set("Authorization", "Bearer " + token);
        HttpEntity entity = new HttpEntity<>(objectMapper.writeValueAsString(request), headers);

        return restTemplate.exchange("/api/v0/query", HttpMethod.POST, entity, String.class);
    }

}
