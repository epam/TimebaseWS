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

import com.epam.deltix.qsrv.hf.tickdb.ui.tbshell.RealtimePlayerThread;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;

public class RealtimePlayer implements PlaybackPlayer {

    private final RealtimePlaybackExecutor executor;

    private final PlaybackConfig config;

    public RealtimePlayer(RealtimePlaybackExecutor executor, PlaybackConfig config) {
        this.executor = executor;
        this.config = config;
        setPermanent(config.isPermanent());
    }

    @Override
    public boolean isActive() {
        return isPermanent() || executor.hasSubscriptions();
    }

    @Override
    public boolean isPermanent() {
        return getState().isPermanent();
    }

    @Override
    public void setPermanent(boolean permanent) {
        executor.setPermanent(permanent);
    }

    @Override
    public void play() {
        checkCommand(PlayerCommands.PLAY, false);
        if (Thread.State.NEW == executor.getState()){
            executor.start();
        } else if (!executor.isPlaying()){
            executor.restart();
        }
    }

    @Override
    public void setSpeed(double speed) {

    }

    //    @Override
//    public void setSpeed(double speed) {
//        executor.setSpeed(speed);
//    }

    @Override
    public PlaybackConfig getConfig() {
        return config;
    }

    @Override
    public PlaybackStatus getState() {
        return executor.getStatus();
    }


    @Override
    public void pause() {
        checkCommand(PlayerCommands.PAUSE, true);
        executor.setMode (RealtimePlayerThread.PlayMode.PAUSED);
    }

    @Override
    public void resume() {
        checkCommand(PlayerCommands.RESUME, true);
        executor.setMode (RealtimePlayerThread.PlayMode.PLAY);
    }

    @Override
    public void stop() {
        if (executor.isPlaying()) {
            executor.setMode (RealtimePlayerThread.PlayMode.STOP);
        }
    }

    @Override
    public void close() {
        executor.cancel();
        try {
            executor.join ();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); // Restore interruption flag.
            throw new RuntimeException(e);
        }
    }

    @Override
    public void skip() {
        checkCommand(PlayerCommands.SKIP, true);
        executor.setMode (RealtimePlayerThread.PlayMode.SKIP);
    }

    @Override
    public void addSubscriptionChannel(SubscriptionChannel channel) {
        executor.addSubscriptionChannel(channel);
    }

    @Override
    public void removeSubscriptionChannel(SubscriptionChannel channel) {
        executor.removeSubscriptionChannel(channel);
    }

    private void checkCommand(PlayerCommands command, boolean expectedPlaying) {
        if (expectedPlaying != executor.isPlaying()){
            String message = String.format("%s command cannot be used because the playback is%s running",
                    command, executor.isPlaying() ? "" : " not");
            throw new IllegalArgumentException(message);
        }
    }

}