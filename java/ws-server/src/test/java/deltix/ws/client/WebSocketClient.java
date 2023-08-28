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
package deltix.ws.client;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.gflog.api.LogLevel;

import javax.websocket.*;
import java.net.URI;
import java.util.concurrent.CountDownLatch;

@ClientEndpoint
public class WebSocketClient {

    private Session session;
    private static final Log LOGGER = LogFactory.getLog(WebSocketClient.class);
    private long count;


    public WebSocketClient(URI uri) {
        try {
            count = 0;
            WebSocketContainer container = ContainerProvider.getWebSocketContainer();
            session = container.connectToServer(this, uri);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @OnOpen
    public void onOpen(Session session) {
        LOGGER.log(LogLevel.INFO, "opening websocket session: " + session.getId());
        this.session = session;
    }

    @OnClose
    public void onClose(Session session) {
        LOGGER.log(LogLevel.INFO, String.format("closing websocket session: %s, got %d%n messages", session.getId(), count));
        this.session = null;
    }

    @OnMessage
    public void onMessage(String message) {
        count++;
    }

    public long getCount() {
        return count;
    }

    public boolean isConnected() {
        return session!=null && session.isOpen();
    }
}