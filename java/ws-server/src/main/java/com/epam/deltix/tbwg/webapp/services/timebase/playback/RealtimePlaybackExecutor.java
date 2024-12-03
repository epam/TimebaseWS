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


import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.qsrv.hf.tickdb.schema.SchemaConverter;
import com.epam.deltix.qsrv.hf.tickdb.ui.tbshell.RealtimePlayerThread;
import com.epam.deltix.streaming.MessageChannel;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.TimeStamp;
import com.epam.deltix.util.time.TimeKeeper;
import org.jetbrains.annotations.NotNull;

import javax.annotation.Nullable;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;


public class RealtimePlaybackExecutor extends RealtimePlayerThread {

    private final long startTimeNano;
    private final boolean updateEndTime;
    private final InstrumentMessageSource src;
    private long endTimeNano;
    private final Lock lock = new ReentrantLock();
    private final Condition stopped = lock.newCondition();
    private volatile boolean cancel = false;

    private final CopyOnWriteArrayList<SubscriptionChannel> subscriptionChannels = new CopyOnWriteArrayList<>();
    private long nextRepTime = 0;
    private final PlaybackStatus status = new PlaybackStatus();
    private final StatusUpdater updater = new StatusUpdater();

    public RealtimePlaybackExecutor(InstrumentMessageSource src, MessageChannel<InstrumentMessage> dest,
                                    SchemaConverter converter, @Nullable Runnable streamRestarter, double speed,
                                    long startTimeNano, long endTimeNano, boolean updateEndTime) {
        super(src, dest, converter, streamRestarter, speed);
        this.src = src;
        this.startTimeNano = startTimeNano;
        this.endTimeNano = endTimeNano;
        this.updateEndTime = updateEndTime;
        this.status.setSpeed(speed);
        updater.start();
    }

    public void addSubscriptionChannel(SubscriptionChannel subscriptionChannel) {
        this.subscriptionChannels.add(subscriptionChannel);
    }

    public void removeSubscriptionChannel(SubscriptionChannel subscriptionChannel) {
        this.subscriptionChannels.remove(subscriptionChannel);
    }

    public boolean hasSubscriptions() {
        return !this.subscriptionChannels.isEmpty();
    }

    public boolean isPlaying() {
        return status.getMod() != PlayMode.STOP;
    }

    @Override
    public void setMode(@NotNull PlayMode mode) {
        super.setMode(mode);
        status.setMod(mode == PlayMode.SKIP ? PlayMode.PLAY : mode);
        sentStatus();
    }

//    @Override
//    public void setSpeed(double speed) {
//        super.setSpeed(speed);
//        status.setSpeed(speed);
//        sentStatus();
//    }

    public void setPermanent(boolean permanent) {
        status.setPermanent(permanent);
        sentStatus();
    }

    public void restart() {
        lock.lock();
        stopped.signal();
        lock.unlock();
    }

    @Override
    public void run() {
        while (!cancel){  // to restart playback
            setMode(PlayMode.PLAY);
            lock.lock();
            super.run();
            status.setProgress(1);
            status.setMod(PlayMode.STOP);
            sentStatus();
            try {
                src.reset(TimeUnit.NANOSECONDS.toMillis(startTimeNano));
                stopped.await();
            } catch (InterruptedException e) {
                if (Thread.currentThread().isInterrupted()) {
                    break;
                }
            } finally {
                lock.unlock();
            }
        }
    }

    @Override
    protected void onMessageConversionError(RawMessage msg) {
    }

    @Override
    protected void log(long mt, long now, RawMessage outMsg) {
        if (now > nextRepTime) {
            updateAndSentStatus(mt);
            nextRepTime = now + 2000 * TimeStamp.NANOS_PER_MS;
        }
    }

    private void updateAndSentStatus(long timeNanos) {
        if (updateEndTime) {
            endTimeNano = TimeKeeper.currentTimeNanos;
        }
        status.setProgress(1.0 * (timeNanos - startTimeNano) / (endTimeNano - startTimeNano));
        sentStatus();
    }

    private void sentStatus() {
        if (!subscriptionChannels.isEmpty()) {
            for (SubscriptionChannel subscriptionChannel : subscriptionChannels) {
                subscriptionChannel.sendMessage(status);
            }
        }
    }

    public void cancel() {
        setMode(PlayMode.STOP);
        stopUpdate();
        lock.lock();
        cancel = true;
        stopped.signal();
        lock.unlock();
    }

    public void stopUpdate() {
        updater.isAlive = false;
        updater.interrupt();
    }

    public PlaybackStatus getStatus() {
        return status;
    }

    private class StatusUpdater extends Thread {

        volatile boolean isAlive = true;

        @Override
        public void run() {
            while (isAlive) {
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException e) {
                    if (Thread.currentThread().isInterrupted()) {
                        isAlive = false;
                    }
                }
                sentStatus();
            }
        }
    }
}