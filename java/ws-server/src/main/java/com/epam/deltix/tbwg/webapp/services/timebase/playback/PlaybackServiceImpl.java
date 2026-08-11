/*
 * Copyright 2024 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.services.timebase.playback;


import com.epam.deltix.data.stream.DXChannel;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.util.SchemaMerger;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.qsrv.hf.tickdb.pub.topic.DirectChannel;
import com.epam.deltix.qsrv.hf.tickdb.pub.topic.TopicDB;
import com.epam.deltix.qsrv.hf.tickdb.schema.SchemaConverter;
import com.epam.deltix.qsrv.hf.tickdb.ui.tbshell.TickDBShell;
import com.epam.deltix.streaming.MessageChannel;
import com.epam.deltix.streaming.MessageSource;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseRegistry;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.NoStreamsException;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.util.lang.Util;
import com.epam.deltix.util.time.TimeKeeper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.BiConsumer;

import static com.epam.deltix.tbwg.webapp.utils.TimeBaseUtils.getStartTime;

@Service
public class PlaybackServiceImpl implements PlaybackService {

    private static final Log LOGGER = LogFactory.getLog(PlaybackServiceImpl.class);

    private final static AtomicLong ID_GENERATOR = new AtomicLong(System.currentTimeMillis());

    private final Map<Long, PlaybackPlayer> players = new HashMap<>();
    private final Map<Long, String> playerToUser = new HashMap<>();
    private final List<PlaybackListener> listeners = new CopyOnWriteArrayList<>();

    @Value("${playback.max-players:8}")
    private int maxPlayers;
    @Value("${playback.close-delay:60}")
    private long closeDelaySec;

    private final TimebaseRegistry registry;

    public PlaybackServiceImpl(TimebaseRegistry registry) {
        this.registry = registry;
    }

    @Override
    public long createPlayer(PlaybackConfig config, String userName) throws NoStreamsException {
        TimebaseService sourceService = registry.resolve(config.getSourceTb());
        TimebaseService targetService = registry.resolve(config.getTargetTb());
        synchronized (players) {
            checkSize();
            long id = ID_GENERATOR.incrementAndGet();
            PlaybackPlayer player = createNewPlayer(config, sourceService, targetService);
            players.put(id, player);
            playerToUser.put(id, userName);
            listeners.forEach(l -> l.playbackCreated(id));
            delayedClose(player, id);
            return id;
        }
    }

    @Override
    public void playPlayer(long id) {
        getPlayerById(id).play();
    }

    @Override
    public void setPlayerSpeed(long id, double speed) {
        getPlayerById(id).setSpeed(speed);
    }

    @Override
    public void pausePlayer(long id) {
        getPlayerById(id).pause();
    }

    @Override
    public void resumePlayer(long id) {
        getPlayerById(id).resume();
    }

    @Override
    public void stopPlayer(long id) {
        getPlayerById(id).stop();
    }

    @Override
    public void skipPlayer(long id) {
        getPlayerById(id).skip();
    }

    private void checkSize() {
        if (players.size() >= maxPlayers) {
            LOGGER.error().append("Unable to create a new playback process.")
                    .append(" The number of active playbacks has reached the maximum value: ").append(maxPlayers)
                    .commit();
            throw new RuntimeException("Max number of playbacks exceeded (" + maxPlayers + ")");
        }
    }

    private PlaybackPlayer createNewPlayer(PlaybackConfig config, TimebaseService sourceService, TimebaseService targetService) throws NoStreamsException {
        return createRealtimePlayer(config, sourceService, targetService);
    }

    private PlaybackPlayer createRealtimePlayer(PlaybackConfig config, TimebaseService sourceService, TimebaseService targetService) throws NoStreamsException {

        DXTickStream[] sourceStreams = TBWGUtils.match(sourceService, config.getSourceStreams());
        if (sourceStreams == null) {
            throw new NoStreamsException(config.getSourceStreams());
        }
        DXChannel targetChannel;
        try {
            if (config.isTargetTopic()) {
                targetChannel = getOrCreateTopic(targetService, config.getTargetStream(), sourceStreams);
            } else {
                targetChannel = getOrCreateStream(targetService, config.getTargetStream(), sourceStreams);
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Can't create playback destination. Reason: " + e.getMessage(), e);
        }

        SchemaConverter converter = TickDBShell.createConverter(targetChannel, sourceStreams);
        if (converter == null) {
            throw new IllegalArgumentException("Source and destination is not compatible.");
        }

        MessageSource<InstrumentMessage> cur = null;
        MessageChannel out = null;

        RealtimePlaybackExecutor playerExecutor;
        try {
            long startTime = config.getTime() != Long.MIN_VALUE ? config.getTime() : getStartTime(sourceStreams);

            LoadingOptions rawLoaderOptions = LoadingOptions.withRewriteMode(true);
            SelectionOptions selectionOptions = new SelectionOptions(true, false);
            DXTickDB connection = sourceService.getConnection();
            final InstrumentMessageSource finalCur = connection.select(startTime, selectionOptions, sourceStreams);
            cur = finalCur;
            if (config.isTargetTopic()) {
                out = targetChannel.createPublisher(rawLoaderOptions);
            } else {
                out = ((DXTickStream) targetChannel).createLoader(rawLoaderOptions);

            }

            boolean updateEndTime;
            long progressEndTimeNano;
            long endTimeNano;
            if (config.getStopAtTimestamp() == Long.MAX_VALUE) {
                updateEndTime = true;
                endTimeNano = Long.MAX_VALUE;
                progressEndTimeNano = TimeKeeper.currentTimeNanos;
            } else {
                updateEndTime = false;
                endTimeNano = progressEndTimeNano = TimeUnit.MILLISECONDS.toNanos(config.getStopAtTimestamp());
            }
            long startTimeNano = TimeUnit.MILLISECONDS.toNanos(startTime);

            Runnable streamRestarter = config.isCyclic() ? () -> finalCur.reset(startTime) : null;
            playerExecutor = new RealtimePlaybackExecutor(finalCur, out, converter, streamRestarter, config.getSpeed(),
                    startTimeNano, progressEndTimeNano, updateEndTime);
            playerExecutor.setEndTimeNano(endTimeNano);

            cur = null; // let them escape
            out = null;
        } finally {
            Util.close(cur);
            Util.close(out);
        }

        return new RealtimePlayer(playerExecutor, config);
    }

    private DXChannel getOrCreateTopic(TimebaseService service, String key, DXTickStream[] sourceStreams) {
        TopicDB db = service.getTopicDB();
        DirectChannel topic = db.getTopic(key);
        if (topic == null) {
            RecordClassDescriptor[] types = mergeStreamsSchema(sourceStreams);
            topic = db.createTopic(key, types, null);
        }
        return topic;
    }

    private DXTickStream getOrCreateStream(TimebaseService service, String targetStreamName, StreamOptions options) {
        DXTickDB db = service.getConnection();
        DXTickStream stream = db.getStream(targetStreamName);
        if (stream == null) {
            options.version = null;
            options.name = targetStreamName;
            stream = db.createStream(targetStreamName, options);
        }
        return stream;
    }

    private DXTickStream getOrCreateStream(TimebaseService service, String targetStreamName, DXTickStream[] streams) {
        if (streams.length == 1) {
            return getOrCreateStream(service, targetStreamName, streams[0].getStreamOptions());
        }
        DXTickDB db = service.getConnection();
        DXTickStream stream = db.getStream(targetStreamName);
        if (stream == null) {
            StreamOptions options = new StreamOptions(StreamScope.DURABLE, targetStreamName, null, 1);
            options.setPolymorphic(mergeStreamsSchema(streams));
            stream = db.createStream(targetStreamName, options);
        }
        return stream;
    }

    private PlaybackPlayer getPlayerById(long id) {
        PlaybackPlayer player = players.get(id);
        if (player == null) {
            throw new IllegalArgumentException("Playback not found");
        }
        return player;
    }

    @Override
    public void activeSubscribe(long id, SubscriptionChannel channel) {
        PlaybackPlayer player = getPlayerById(id);
        player.addSubscriptionChannel(channel);
    }

    @Override
    public void unsubscribe(long playerId, SubscriptionChannel channel) {
        PlaybackPlayer player;
        try {
            player = getPlayerById(playerId);
        } catch (IllegalArgumentException e) {
            return;
        }
        player.removeSubscriptionChannel(channel);
        if (!player.isActive()) {
            delayedClose(player, playerId);
        }
    }

    private void delayedClose(PlaybackPlayer player, long playerId) {
        new Thread(() -> {
            try {
                Thread.sleep(closeDelaySec * 1000);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            if (!player.isActive()) {
                closePlayer(playerId);
            }
        }).start();
    }

    @Override
    public void closePlayer(long playerId) {
        PlaybackPlayer player;
        try {
            player = getPlayerById(playerId);
        } catch (IllegalArgumentException e) {
            return;
        }
        synchronized (players) {
            players.remove(playerId);
            playerToUser.remove(playerId);
            player.close();
            listeners.forEach(l -> l.playbackFinish(playerId));
        }
    }

    @Override
    public List<Long> playbackList(String user) {
        List<Long> ids = new ArrayList<>();
        for (Map.Entry<Long, String> entry : playerToUser.entrySet()) {
            if (entry.getValue().equals(user)) {
                ids.add(entry.getKey());
            }
        }
        return ids;
    }

    @Override
    public void forEachPlayback(String user, BiConsumer<Long, PlaybackPlayer> consumer) {
        synchronized (players) {
            playbackList(user).forEach(id -> {
                PlaybackPlayer player = players.get(id);
                if (player != null) {
                    consumer.accept(id, players.get(id));
                }
            });
        }
    }

    @Override
    public void setPermanent(long id, boolean permanent) {
        PlaybackPlayer player = getPlayerById(id);
        player.setPermanent(permanent);
    }

    @Override
    public void subscribe(PlaybackListener listener) {
        listeners.add(listener);
    }

    @Override
    public void unsubscribeListener(PlaybackListener listener) {
        listeners.remove(listener);
    }

    private RecordClassDescriptor[] mergeStreamsSchema(DXTickStream[] streams) {
        SchemaMerger sm = new SchemaMerger();
        RecordClassDescriptor[] result = null;
        for (DXTickStream stream : streams) {
            if (result == null) {
                result = stream.getTypes();
            } else {
                try {
                    result = sm.merge(result, stream.getTypes());
                } catch (Exception e) {
                    throw new IllegalArgumentException("Can't create schema for target stream. Failed on merge schema from stream: "
                            + stream.getKey() + ". Reason: " + e.getMessage());
                }
            }
        }
        return result;
    }
}