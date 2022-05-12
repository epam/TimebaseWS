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
package com.epam.deltix.tbwg.webapp.services;

import com.epam.deltix.qsrv.hf.tickdb.pub.DBStateListener;
import com.epam.deltix.qsrv.hf.tickdb.pub.DBStateNotifier;
import com.epam.deltix.tbwg.webapp.services.timebase.SystemMessagesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TestDBNotifier implements DBStateNotifier {

    private final SystemMessagesService service;

    Set<DBStateListener> set = ConcurrentHashMap.newKeySet();

    int current = 0;

    @Autowired
    public TestDBNotifier(SystemMessagesService service) {
        this.service = service;
    }

    @PostConstruct
    public void postConstruct() {
        addStateListener(service.getStateListener());
    }

    @Override
    public void addStateListener(DBStateListener listener) {
        set.add(listener);
    }

    @Override
    public void removeStateListener(DBStateListener listener) {
        set.remove(listener);
    }

    @Override
    public void fireStateChanged(String key) {
        set.forEach(listener -> listener.changed(key));
    }

    @Override
    public void fireAdded(String key) {
        set.forEach(listener -> listener.added(key));
    }

    @Override
    public void fireDeleted(String key) {
        set.forEach(listener -> listener.deleted(key));
    }

    @Override
    public void fireRenamed(String fromKey, String toKey) {
        set.forEach(listener -> listener.renamed(fromKey, toKey));
    }

    @Scheduled(initialDelay = 5000, fixedDelay = 2000)
    public void fire() {
        int t = current % 3;
        switch (t) {
            case 0:
                fireAdded("added01");
                fireAdded("added02");
                fireStateChanged("changed01");
                fireStateChanged("changed02");
                fireDeleted("deleted01");
                fireDeleted("deleted02");
                fireRenamed("renamedOld01", "renamedNew01");
                fireRenamed("renamedOld02", "renamedNew02");
                break;
            case 1:
                fireAdded("added11");
                fireAdded("added12");
                fireStateChanged("changed11");
                fireStateChanged("changed12");
                fireDeleted("deleted11");
                fireDeleted("deleted12");
                fireRenamed("renamedOld11", "renamedNew11");
                fireRenamed("renamedOld12", "renamedNew12");
                break;
            case 2:
                fireAdded("added21");
                fireAdded("added22");
                fireStateChanged("changed21");
                fireStateChanged("changed22");
                fireDeleted("deleted21");
                fireDeleted("deleted22");
                fireRenamed("renamedOld21", "renamedNew21");
                fireRenamed("renamedOld22", "renamedNew22");
                break;
        }
        current++;
    }
}
