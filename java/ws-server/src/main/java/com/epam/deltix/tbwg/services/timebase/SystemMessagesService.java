package com.epam.deltix.tbwg.services.timebase;


import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.tickdb.pub.DBStateListener;
import com.epam.deltix.tbwg.config.WebSocketConfig;
import com.epam.deltix.tbwg.model.ws.system.StreamStates;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;

@Service
public class SystemMessagesService {

    private static final Log LOG = LogFactory.getLog(SystemMessagesService.class);

    private final SimpMessagingTemplate template;

    private final StreamStates streamStates = new StreamStates();
    private final StreamsStateListener listener = new StreamsStateListener();

    @Autowired
    public SystemMessagesService(SimpMessagingTemplate template) {
        this.template = template;
    }

    @PostConstruct
    public void logStart() {
        LOG.info().append("Starting ")
                .append(SystemMessagesService.class.getSimpleName())
                .append(" service.")
                .commit();
    }

    @Scheduled(fixedDelay = 1000) // try to broadcast every 1 second
    public void broadcastStreamsState() {
        synchronized (streamStates) {
            if (!streamStates.isEmpty()) {
                template.convertAndSend(WebSocketConfig.STREAMS_TOPIC, streamStates);
                if (LOG.isTraceEnabled()) {
                    LOG.trace().append("Send message to topic ")
                            .append(WebSocketConfig.STREAMS_TOPIC)
                            .append(": ")
                            .append(streamStates)
                            .commit();
                }
                streamStates.clear();
            } else {
                if (LOG.isTraceEnabled())
                    LOG.trace().append("Stream states are empty.").commit();
            }
        }
    }

    public DBStateListener getStateListener() {
        return listener;
    }

    public class StreamsStateListener implements DBStateListener {

        @Override
        public void changed(String key) {
            LOG.trace().append("STREAMS STATE: changed ").append(key).commit();
            streamStates.putChanged(key);
        }

        @Override
        public void added(String key) {
            LOG.trace().append("STREAMS STATE: added ").append(key).commit();
            streamStates.putAdded(key);
        }

        @Override
        public void deleted(String key) {
            LOG.trace().append("STREAMS STATE: deleted ").append(key).commit();
            streamStates.putDeleted(key);
        }

        @Override
        public void renamed(String fromKey, String toKey) {
            LOG.trace().append("STREAMS STATE: renamed {old: ")
                    .append(fromKey).append(", new: ")
                    .append(toKey).append("}")
                    .commit();
            streamStates.putRenamed(fromKey, toKey);
        }
    }
}
