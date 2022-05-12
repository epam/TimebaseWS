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
package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.qsrv.hf.pub.md.ClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.Introspector;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.tbwg.webapp.model.schema.SchemaBuilder;
import com.epam.deltix.tbwg.webapp.model.schema.SchemaDef;
import com.epam.deltix.timebase.messages.universal.PackageHeader;
import org.junit.Test;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;


/**
 * Created by Alex Karpovich on 27/11/2020.
 */
public class Test_SchemaBuilder {

    @Test
    public void test() throws Introspector.IntrospectionException {
        Introspector it = Introspector.createMessageIntrospector();
        RecordClassDescriptor descriptor = it.introspectRecordClass(PackageHeader.class);

        RecordClassSet set = new RecordClassSet();
        set.addContentClasses(descriptor);

        SchemaDef schema = SchemaBuilder.toSchemaDef(set, false);

        RecordClassSet result = SchemaBuilder.toClassSet(schema);


        // compare

        ClassDescriptor[] descriptors = set.getClassDescriptors();
        for (ClassDescriptor cd : descriptors) {
            assertNotNull(result.getClassDescriptor(cd.getName()));
        }

        for (RecordClassDescriptor cd : set.getContentClasses()) {
            assertNotNull(result.getClassDescriptor(cd.getName()));
        }


    }
}
