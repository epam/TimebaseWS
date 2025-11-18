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
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.qsrv.hf.pub.md.json.SchemaBuilder;
import com.epam.deltix.qsrv.hf.pub.md.json.SchemaDef;
import com.epam.deltix.qsrv.hf.tickdb.pub.topic.settings.TopicSettings;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.model.topic.CreateTopicRequest;
import com.epam.deltix.tbwg.webapp.model.tree.TimeBaseStructureRequestDef;
import com.epam.deltix.tbwg.webapp.model.tree.TreeNodeDef;
import com.epam.deltix.tbwg.webapp.services.timebase.MonitorService;
import com.epam.deltix.tbwg.webapp.services.topic.TopicService;
import com.epam.deltix.tbwg.webapp.utils.HeaderAccessorHelper;
import com.epam.deltix.tbwg.webapp.utils.json.JsonBigIntEncoding;
import com.epam.deltix.tbwg.webapp.websockets.subscription.Subscription;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionController;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionControllerRegistry;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

@RestController
@RequestMapping("/api/v0/topics")
@CrossOrigin
public class TopicController implements SubscriptionController {

    private static final Log LOGGER = LogFactory.getLog(TopicController.class);
    private final TopicService topicService;
    private final MonitorService monitorService;

    public TopicController(SubscriptionControllerRegistry registry, TopicService topicService, MonitorService monitorService) {
        registry.register(WebSocketConfig.MONITOR_TOPIC_TOPIC, this);
        this.topicService = topicService;
        this.monitorService = monitorService;
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @GetMapping(value = "", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> listTopics() {
    try {
        return ResponseEntity.ok().body(topicService.listTopics());
    } catch (Exception e) {
        LOGGER.error().append("Couldn't get a list of topics: ").append(e).commit();
        return ResponseEntity.ok().body(Collections.emptyList());
        }
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @PostMapping(value = "/structure", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<TreeNodeDef> getStructure(@RequestBody(required = false) TimeBaseStructureRequestDef request) {
        return ResponseEntity.ok().body(topicService.getStructure(TimeBaseTreeController.buildFilter(request.getFilter(), request.getFilterOptions())));
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @GetMapping(value = "/{topicId}/schema", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SchemaDef> getSchema(@PathVariable String topicId,
                                               @RequestParam(required = false, defaultValue = "false") boolean tree) {

        return ResponseEntity.ok(SchemaBuilder.toSchemaDef(new RecordClassSet(topicService.getTypes(topicId)), tree));
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> create(@RequestBody CreateTopicRequest topicRequest) {
        RecordClassSet recordClassSet = SchemaBuilder.toClassSet(topicRequest.getSchema()); // todo: remove second param when update SchemaDefVersion

        TopicSettings topicSettings = new TopicSettings();  // todo: only TopicType.IPC type support
        String copyToStream = topicRequest.getCopyToStream();
        if (copyToStream != null && copyToStream.isEmpty()) {
            copyToStream = null;
        }
        topicSettings.setCopyToStream(copyToStream);
        topicService.createTopic(topicRequest.getKey(), recordClassSet.getContentClasses(), topicSettings);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "/{topicId}/rename/{newTopicId}")
    public ResponseEntity<?> rename(@PathVariable String topicId, @PathVariable String newTopicId) {
        if (true) {
            throw new UnsupportedOperationException("Can not rename topic");// todo
        }
        topicService.rename(topicId, newTopicId);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @DeleteMapping(value = "/{topicId}")
    public ResponseEntity<?> delete(@PathVariable String topicId) {
        topicService.delete(topicId);
        return ResponseEntity.noContent().build();

    }

    @Override
    public Subscription onSubscribe(SimpMessageHeaderAccessor header, SubscriptionChannel channel) {
        String destination = header.getDestination();
        if (destination == null) {
            throw new RuntimeException(
                    String.format("Can't find destination on subscribe with sessionId = %s and subscriptionId = %s",
                            header.getSessionId(), header.getSubscriptionId()));
        }
        String topicKey = URLDecoder.decode(extractId(destination), StandardCharsets.UTF_8);
        String sessionId = header.getSessionId();
        String subscriptionId = header.getSubscriptionId();
        JsonBigIntEncoding bigIntEncoding = HeaderAccessorHelper.getJsonBigIntEncoding(header);

        monitorService.subscribeTopic(sessionId, subscriptionId, topicKey, channel::sendMessage, bigIntEncoding);
        return () -> monitorService.unsubscribe(sessionId, subscriptionId);
    }

    private String extractId(String destination) {
        String controlString = WebSocketConfig.MONITOR_TOPIC_TOPIC + "/";
        String url = destination.substring(0, destination.indexOf('?'));
        int id = url.indexOf(controlString);
        if (id < 0) {
            throw new RuntimeException("Can't extract import id from destination: " + url);
        }
        return url.substring(id + controlString.length());
    }
}