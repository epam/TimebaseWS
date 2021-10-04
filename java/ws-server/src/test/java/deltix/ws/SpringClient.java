package deltix.ws;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.util.concurrent.ListenableFuture;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.Transport;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import javax.websocket.ContainerProvider;
import javax.websocket.WebSocketContainer;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

/**
 * Created by Alex Karpovich on 7/10/2018.
 */
public class SpringClient {

    public static WebSocketStompClient getWsClient() {
        List<Transport> transports = new ArrayList<>();

        WebSocketContainer container = ContainerProvider.getWebSocketContainer();
        container.setDefaultMaxBinaryMessageBufferSize(1024 * 1024);
        container.setDefaultMaxTextMessageBufferSize(1024 * 1024);
        transports.add(new WebSocketTransport(new StandardWebSocketClient(container)));

        WebSocketClient webSocketClient = new SockJsClient(transports);
        WebSocketStompClient stompClient = new WebSocketStompClient(webSocketClient);
        stompClient.setInboundMessageSizeLimit(Integer.MAX_VALUE);
        stompClient.setMessageConverter(new MappingJackson2MessageConverter());
        return stompClient;
    }

    public static WebSocketStompClient getClient() {
        //List<Transport> transports = new ArrayList<>();

        WebSocketContainer container = ContainerProvider.getWebSocketContainer();
        container.setDefaultMaxBinaryMessageBufferSize(1024 * 1024);
        container.setDefaultMaxTextMessageBufferSize(1024 * 1024);
        //transports.add(new WebSocketTransport(new StandardWebSocketClient(container)));

        WebSocketStompClient stompClient = new WebSocketStompClient(new StandardWebSocketClient(container));
        stompClient.setInboundMessageSizeLimit(Integer.MAX_VALUE);
        stompClient.setMessageConverter(new MappingJackson2MessageConverter());
        return stompClient;
    }

    public static void main(String[] args) throws Exception {

        WebSocketStompClient stompClient = getClient();
        //stompClient.setMessageConverter(new MappingJackson2MessageConverter());

        StompSessionHandler sessionHandler = new MyStompSessionHandler();
        ListenableFuture<StompSession> connect = stompClient.connect("ws://localhost:8099/ws/v0/L3/select", sessionHandler);
        StompSession session = connect.get();
        session.subscribe(new StompHeaders(), new MyStompFrameHandler());

        new Scanner(System.in).nextLine();
    }


    public static class MyStompFrameHandler implements StompFrameHandler {
        int count = 0;

        @Override
        public Type getPayloadType(StompHeaders headers) {
            return String.class;
        }

        @Override
        public void handleFrame(StompHeaders headers, Object payload) {
            count++;
        }
    }


    public static class MyStompSessionHandler implements StompSessionHandler {
        int count = 0;

        private Log logger = LogFactory.getLog(MyStompSessionHandler.class);

        @Override
        public void handleTransportError(StompSession session, Throwable exception) {

        }

        @Override
        public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
            logger.info("New session established : " + session.getSessionId());
//            session.subscribe("/topic/messages", this);
//            logger.info("Subscribed to /topic/messages");
//            session.send("/app/chat", getSampleMessage());
//            logger.info("Message sent to websocket server");
        }

        @Override
        public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
            logger.error("Got an exception: " + exception);
        }

        @Override
        public Type getPayloadType(StompHeaders headers) {
            return String.class;
        }

        @Override
        public void handleFrame(StompHeaders headers, Object payload) {
            String msg = (String) payload;
            logger.info("Received : " + msg);
        }

//        /**
//         * A sample message instance.
//         * @return instance of <code>Message</code>
//         */
//        private Message getSampleMessage() {
//            Message msg = new Message();
//            msg.setFrom("Nicky");
//            msg.setText("Howdy!!");
//            return msg;
//        }
    }
}
