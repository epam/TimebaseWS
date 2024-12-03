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

import com.epam.deltix.tbwg.webapp.services.timebase.exc.NoStreamsException;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;

import java.util.List;
import java.util.function.BiConsumer;

public interface PlaybackService {

    long createPlayer(PlaybackConfig config, String userName) throws NoStreamsException;

    void playPlayer(long id);

    void setPlayerSpeed(long id, double speed);

    void pausePlayer(long id);

    void resumePlayer(long id);

    void stopPlayer(long id);

    void skipPlayer(long id);

    void activeSubscribe(long id, SubscriptionChannel channel);

    void unsubscribe(long playerId, SubscriptionChannel channel);

    void closePlayer(long playerId);

    List<Long> playbackList(String user);

    void forEachPlayback(String user, BiConsumer<Long, PlaybackPlayer> consumer);

    void setPermanent(long id, boolean permanent);

    void subscribe(PlaybackListener listener);

    void unsubscribeListener(PlaybackListener listener);

}