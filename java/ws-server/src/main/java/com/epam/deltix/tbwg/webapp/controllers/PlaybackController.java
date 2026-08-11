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
package com.epam.deltix.tbwg.webapp.controllers;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.model.input.PlaybackRequest;
import com.epam.deltix.tbwg.webapp.model.playback.PlaybackDef;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.NoStreamsException;
import com.epam.deltix.tbwg.webapp.services.timebase.playback.PlaybackConfig;
import com.epam.deltix.tbwg.webapp.services.timebase.playback.PlaybackPlayer;
import com.epam.deltix.tbwg.webapp.services.timebase.playback.PlaybackServiceImpl;
import com.epam.deltix.tbwg.webapp.websockets.subscription.Subscription;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionController;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionControllerRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;


@RestController
@RequestMapping("/api/v0/playback")
public class PlaybackController implements SubscriptionController {

    private static final Log LOGGER = LogFactory.getLog(PlaybackController.class);

    private final PlaybackServiceImpl playbackService;

    @Autowired
    public PlaybackController(SubscriptionControllerRegistry subscriptionRegistry,
                              PlaybackServiceImpl playbackService) {
        subscriptionRegistry.register(WebSocketConfig.PLAYBACK_TOPIC, this);
        this.playbackService = playbackService;
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping()
    public ResponseEntity<Long> createPlayback(@RequestBody PlaybackRequest request, Principal user) throws NoStreamsException {
        if (request.getTargetStream() == null || request.getTargetStream().isEmpty()) {
            throw new IllegalArgumentException("Target stream not defined");
        }
        PlaybackConfig config = new PlaybackConfig();
        config.setSourceStreams(request.getSourceStreams());
        config.setTargetStream(request.getTargetStream());
        config.setTime(request.getFrom() != null ? request.getFrom().toEpochMilli() : Long.MIN_VALUE);
        config.setStopAtTimestamp(request.getTo() != null ? request.getTo().toEpochMilli() : Long.MAX_VALUE);
        config.setSpeed(request.getSpeed());
        config.setCyclic(request.isCyclic());
        config.setTargetTopic(request.isTargetTopic());
        config.setPermanent(request.isPermanent());
        config.setSourceTb(request.getSourceTb());
        config.setTargetTb(request.getTargetTb());
        return new ResponseEntity<>(playbackService.createPlayer(config, user.getName()), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @GetMapping()
    public ResponseEntity<?> playbackList(Principal user, @RequestParam(required = false) Boolean permanent) {
        List<PlaybackDef> result = new ArrayList<>();
        playbackService.forEachPlayback(user.getName(), (id, playback) -> {
            if (permanent == null || playback.isPermanent() == permanent) {
                result.add(createDef(id, playback));
            }
        });
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "play")
    public ResponseEntity<?> playPlayback(@RequestParam long id) {
        playbackService.playPlayer(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "permanent")
    public ResponseEntity<?> setPermanent(@RequestParam long id, @RequestParam boolean permanent) {
        playbackService.setPermanent(id, permanent);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "speed")
    public ResponseEntity<?> changeSpeed(@RequestParam long id, @RequestParam double speed) {
        playbackService.setPlayerSpeed(id, speed);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "pause")
    public ResponseEntity<?> pausePlayback(@RequestParam long id) {
        playbackService.pausePlayer(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "resume")
    public ResponseEntity<?> resumePlayback(@RequestParam long id) {
        playbackService.resumePlayer(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "stop")
    public ResponseEntity<?> stopPlayback(@RequestParam long id) {
        playbackService.stopPlayer(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "skip")
    public ResponseEntity<?> skipPlayback(@RequestParam long id) {
        playbackService.skipPlayer(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "close")
    public ResponseEntity<?> closePlayback(@RequestParam long id) {
        playbackService.closePlayer(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Override
    public Subscription onSubscribe(SimpMessageHeaderAccessor header, SubscriptionChannel channel) {
        String destination = header.getDestination();
        if (destination == null) {
            throw new RuntimeException(
                    String.format("Can't find destination on subscribe with sessionId = %s and subscriptionId = %s",
                            header.getSessionId(), header.getSubscriptionId()));
        }
        long id = extractId(destination);
        playbackService.activeSubscribe(id, channel);
        return () -> playbackService.unsubscribe(id, channel);
    }
    private long extractId(String destination) {
        String controlString = WebSocketConfig.PLAYBACK_TOPIC + "/";
        String url = destination.substring(0, destination.indexOf('?'));
        int id = url.indexOf(controlString);
        if (id < 0) {
            throw new RuntimeException("Can't extract playback id from destination: " + url);
        }
        try {
            String strId = url.substring(id + controlString.length());
            return Long.parseLong(strId);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Can't extract playback id from destination: " + url);
        }
    }

    private PlaybackDef createDef(long id, PlaybackPlayer player) {
        PlaybackDef def = new PlaybackDef();
        def.id = id;
        def.sourceStreams = player.getConfig().getSourceStreams();
        def.targetStream = player.getConfig().getTargetStream();
        def.speed = player.getState().getSpeed();
        def.permanent = player.isPermanent();
        def.active = player.isActive();
        def.progress = player.getState().getProgress();
        def.state = player.getState().getMod();

        return def;
    }


}