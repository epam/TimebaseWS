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
package deltix.ws;


import org.glassfish.tyrus.server.Server;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 * Created by Alex Karpovich on 7/5/2018.
 */
@ServerEndpoint(value = "/data")
public class WSServer {

    //private Logger logger = Logger.getLogger(this.getClass().getName());

    @OnOpen
    public void onOpen(Session session) {
        System.out.println("Connected ... " + session.getId());

        new Thread(() -> {
            String msg = "{\"symbol\":\"BTCUSD\",\"timestamp\":\"2018-06-28T18:34:11.659Z\",\"currencyCode\":999,\"entries\":[{\"type\":\"L1Entry\",\"exchangeId\":\"GDAX\",\"price\":6099.99,\"size\":8.25131794,\"isNational\":false,\"side\":\"BID\"},{\"type\":\"L1Entry\",\"exchangeId\":\"GDAX\",\"price\":6100,\"size\":5.76032885,\"isNational\":false,\"side\":\"ASK\"}],\"packageType\":\"INCREMENTAL_UPDATE\"}";
            RemoteEndpoint.Basic remote = session.getBasicRemote();
            for (int i =0; i < 10_000; i++) {
                try {
                    remote.sendText(msg);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

            try {
                remote.sendText("close");
            } catch (IOException e) {
                e.printStackTrace();
            }
        }).start();
    }

    @OnMessage
    public String onMessage(String message, final Session session) {
//        System.out.println("Got message: " + message);
//
//        switch (message) {
//            case "close":
//                try {
//                    session.close(new CloseReason(CloseReason.CloseCodes.NORMAL_CLOSURE, "Game ended"));
//                } catch (IOException e) {
//                    throw new RuntimeException(e);
//                }
//                break;
//
//            case "start":
//
//                break;
//        }
        return message;
    }

    @OnClose
    public void onClose(Session session, CloseReason closeReason) {
        System.out.printf("Session %s closed because of %s", session.getId(), closeReason);
    }

    public static void main(String[] args) {
        Server server = new Server("localhost", 8025, "/ws", null, WSServer.class);

        try {
            server.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
            System.out.print("Please press a key to stop the server.");
            reader.readLine();
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            server.stop();
        }
    }

}