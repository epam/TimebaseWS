package com.epam.deltix.tbwg.model.schema;

import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;

public class DescribeResponse {

    private String ddl;

    public String getDdl() {
        return ddl;
    }

    public void setDdl(String ddl) {
        this.ddl = ddl;
    }

    public static DescribeResponse create(DXTickStream stream) {
        DescribeResponse response = new DescribeResponse();
        response.setDdl(stream.describe());
        return response;
    }
}
