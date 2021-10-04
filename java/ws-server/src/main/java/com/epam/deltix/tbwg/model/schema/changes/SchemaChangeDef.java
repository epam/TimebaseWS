package com.epam.deltix.tbwg.model.schema.changes;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.qsrv.hf.tickdb.schema.SchemaChange.Impact;

public interface SchemaChangeDef {

    @JsonProperty("changeImpact")
    Impact getChangeImpact();

}
