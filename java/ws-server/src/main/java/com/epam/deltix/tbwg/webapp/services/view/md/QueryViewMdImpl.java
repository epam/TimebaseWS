/*
 * Copyright 2023 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.services.view.md;

import java.util.List;
import java.util.Objects;

class QueryViewMdImpl extends ViewMdImpl implements MutableQueryViewMd {

    private String query;

    @Override
    public String getQuery() {
        return query;
    }

    @Override
    public void setQuery(String query) {
        this.query = query;
    }

    @Override
    public List<ViewMdChange> getChanges(ViewMd anotherViewMd) {
        List<ViewMdChange> changes = super.getChanges(anotherViewMd);
        if (anotherViewMd instanceof QueryViewMd) {
            QueryViewMd queryViewMd = (QueryViewMd) anotherViewMd;
            if (Objects.equals(query, queryViewMd.getQuery())) {
                changes.add(
                    new ViewMdChange("query", query, queryViewMd.getQuery())
                );
            }
        }

        return changes;
    }

    @Override
    public String toString() {
        return "QueryViewMdImpl{" +
            "id='" + getId() + '\'' +
            ", state=" + getState() +
            ", lastTimestamp=" + getLastTimestamp() +
            '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        QueryViewMdImpl that = (QueryViewMdImpl) o;
        return Objects.equals(query, that.query);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), query);
    }
}
