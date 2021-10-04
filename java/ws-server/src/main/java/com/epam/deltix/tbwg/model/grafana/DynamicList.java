package com.epam.deltix.tbwg.model.grafana;

import java.util.Collection;

public class DynamicList {

    private Collection<String> list;
    private boolean hasMore;

    public Collection<String> getList() {
        return list;
    }

    public void setList(Collection<String> list) {
        this.list = list;
    }

    public boolean isHasMore() {
        return hasMore;
    }

    public void setHasMore(boolean hasMore) {
        this.hasMore = hasMore;
    }
}
