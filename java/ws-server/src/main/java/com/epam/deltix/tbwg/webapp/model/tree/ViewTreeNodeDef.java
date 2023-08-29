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


import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.tbwg.webapp.model.charting.ChartTypeDef;
import com.epam.deltix.tbwg.webapp.services.view.md.ViewMd;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter
public class ViewTreeNodeDef extends TreeNodeDef {

    @JsonProperty
    private List<ChartTypeDef> chartType;

    @JsonProperty
    private ViewMd viewMd;

    public ViewTreeNodeDef(String id, String name, TreeNodeType type) {
        super(id, name, type);
    }
}