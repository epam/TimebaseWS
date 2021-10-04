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
