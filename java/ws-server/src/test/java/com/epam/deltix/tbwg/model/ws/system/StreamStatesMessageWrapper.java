package com.epam.deltix.tbwg.model.ws.system;

import java.util.List;

public class StreamStatesMessageWrapper extends StreamStates {

    public synchronized void setAdded(List<String> added) {
        this.added.clear();
        this.added.addAll(added);
    }

    public synchronized void setDeleted(List<String> added) {
        this.deleted.clear();
        this.deleted.addAll(added);
    }

    public synchronized void setChanged(List<String> added) {
        this.changed.clear();
        this.changed.addAll(added);
    }

    public synchronized void setRenamed(List<RenameMessage> renamed) {
        this.renamed.clear();
        this.renamed.addAll(renamed);
    }

    @Override
    public long getId() {
        return id.get();
    }
}
