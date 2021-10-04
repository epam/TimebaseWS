/*
 * Copyright 2021 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.utils;

import org.agrona.LangUtil;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * Copied from anvil-lang because of transitive dependency in GFLog.
 */
public class ShutdownSignal {

    private static final boolean DEBUG = Boolean.getBoolean("shutdown.debug");

    private final CountDownLatch latch = new CountDownLatch(1);

    public ShutdownSignal() {
        final Thread shutdownHook = new Thread(new ShutdownSignalHook(), "shutdown-signal-hook");
        Runtime.getRuntime().addShutdownHook(shutdownHook);
    }

    public boolean isSignaled() {
        return latch.getCount() <= 0;
    }

    /**
     * Programmatically signal awaiting threads.
     */
    public void signal() {
        latch.countDown();
    }

    /**
     * Await the reception of the shutdown signal.
     */
    public void await() {
        try {
            latch.await();
        } catch (final InterruptedException e) {
            LangUtil.rethrowUnchecked(e);
        }
    }

    public boolean await(final long timeout, final TimeUnit unit) {
        try {
            return latch.await(timeout, unit);
        } catch (final InterruptedException e) {
            LangUtil.rethrowUnchecked(e);
            return false;
        }
    }

    private class ShutdownSignalHook implements Runnable {

        private final Thread mainThread;

        public ShutdownSignalHook() {
            final Thread caller = Thread.currentThread();
            if (!caller.getName().equals("main")) {
                throw new IllegalStateException("The caller thread must be main thread, but: " + caller);
            }

            this.mainThread = caller;
        }

        @Override
        public void run() {
            signal();

            try {
                mainThread.join();
            } catch (final InterruptedException e) {
                LangUtil.rethrowUnchecked(e);
            }


            if (DEBUG) {
                dump();
            }
        }

    }

    private static void dump() {
        System.out.println();
        System.out.println("Thread Dump:");

        Thread.getAllStackTraces().forEach((thread, stack) -> {
            System.out.println();

            System.out.println(
                    "Thread: " + thread.getName() +
                            ", Group: " + thread.getThreadGroup().getName() +
                            ", State: " + thread.getState() +
                            ", Priority: " + thread.getPriority() +
                            ", Daemon: " + thread.isDaemon()
            );

            for (final StackTraceElement element : stack) {
                System.out.println("\t" + element);
            }
        });
    }

}