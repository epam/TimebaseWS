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
package com.epam.deltix.tbwg.webapp.model.charting.line;


import java.util.Objects;

/**
 * A line point that defines a tag.
 * @label Tag
 */
public abstract class TagElementDef extends LineElementDef {
    private TagType tagType;
    private String value;

    /**
     * Tag type.
     */
    public TagType getTagType() {
        return tagType;
    }

    public void setTagType(TagType tagType) {
        this.tagType = tagType;
    }

    /**
     * Tag value. An Y coordinate where the tag should be drawn.
     */
    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    @Override
    public TagElementDef copyFrom(LineElement template) {
        super.copyFrom(template);
        if (template instanceof TagElementDef) {
            TagElementDef t = (TagElementDef) template;
            tagType = t.tagType;
            value = t.value;
        }

        return this;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        TagElementDef that = (TagElementDef) o;
        return tagType == that.tagType &&
            Objects.equals(value, that.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), tagType, value);
    }
}
