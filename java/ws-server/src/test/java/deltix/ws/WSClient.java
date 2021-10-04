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
package deltix.ws;

import javax.websocket.*;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.concurrent.CountDownLatch;

import org.glassfish.tyrus.client.ClientManager;
import org.glassfish.tyrus.client.ClientProperties;

/**
 * Created by Alex Karpovich on 6/28/2018.
 */
@ClientEndpoint
public class WSClient {

    final static CountDownLatch latch = new CountDownLatch(1);

    private static long start;
    private static long end;
    private static long count;

    @OnOpen
    public void onOpen(Session session) {
        session.setMaxTextMessageBufferSize(128 * 1024);
        session.setMaxBinaryMessageBufferSize(128 * 1024);
        // same as above
        start = System.currentTimeMillis();
    }

    @OnMessage
    public String onMessage(String message, Session session) {
        //System.out.println(message);
        count++;

        return message;
    }

    @OnClose
    public void onClose(Session session, CloseReason closeReason) {
        System.out.println(String.format("Session %s close because of %s", session.getId(), closeReason));
        end = System.currentTimeMillis();
        latch.countDown();
    }

    public static void main(String[] args) {
        ClientManager client = ClientManager.createClient();
        try {
            client.getProperties().put(ClientProperties.INCOMING_BUFFER_SIZE, 1024 * 1024);
            Session session = client.connectToServer(WSClient.class, new URI("ws://localhost:8099/ws/v0/L3/select"));
            latch.await();


            double                          s = (end - start) * 0.001;
            System.out.printf (
                    "%,d messages in %,.3fs; speed: %,.0f msg/s\n",
                    count,
                    s,
                    count / s
            );

        } catch (DeploymentException | URISyntaxException | InterruptedException e) {
            throw new RuntimeException(e);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void main2(String[] args) {
        ClientManager client = ClientManager.createClient();
        try {
            Session session = client.connectToServer(WSClient.class, new URI("ws://localhost:8025/ws/data"));
            session.getBasicRemote().sendText("start");
            latch.await();
            session.getBasicRemote().sendText("close");


            double                          s = (end - start) * 0.001;
            System.out.printf (
                    "%,d messages in %,.3fs; speed: %,.0f msg/s\n",
                    count,
                    s,
                    count / s
            );

        } catch (DeploymentException | URISyntaxException | InterruptedException e) {
            throw new RuntimeException(e);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
