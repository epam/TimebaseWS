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