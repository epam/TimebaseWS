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

package com.epam.deltix.tbwg.webapp.services.view.utils;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.ClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.ClassSet;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.qsrv.hf.tickdb.schema.*;

import java.util.Arrays;
import java.util.HashMap;

public class Utils {

    private static final Log LOGGER = LogFactory.getLog(Utils.class);

    public static RecordClassDescriptor[] getQuerySchema(DXTickDB db, String query) {
        ClassSet<?> types = db.describeQuery(query, new SelectionOptions());

        return Arrays.stream(types.getContentClasses())
            .filter(RecordClassDescriptor.class::isInstance)
            .map(RecordClassDescriptor.class::cast)
            .toArray(RecordClassDescriptor[]::new);
    }

    public static boolean isStreamSchemaMatchesQuery(DXTickDB db, DXTickStream stream, String query) {
        if (stream == null) {
            return true;
        }

        return isStreamSchemaMatchesQuery(stream, getQuerySchema(db, query));
    }

    public static boolean isStreamSchemaMatchesQuery(DXTickStream stream, RecordClassDescriptor[] requiredDescriptors) {
        try {
            StreamMetaDataChange change = new SchemaAnalyzer(new SchemaMapping()).getChanges(
                stream.getStreamOptions().getMetaData(),
                MetaDataChange.ContentType.Polymorphic,
                new RecordClassSet(requiredDescriptors),
                MetaDataChange.ContentType.Polymorphic
            );

            return change.getChangeImpact() == SchemaChange.Impact.None;
        } catch (Throwable t) {
            LOGGER.error().append("Failed to process stream schema changes").append(t).commit();

            return false;
        }
    }

    public static SchemaAnalyzer createSchemaAnalyzer(RecordClassDescriptor[] inTypes, RecordClassDescriptor[] outTypes) {
        //SchemaMapping mapping = new SchemaUpdater(new ClassMappings()).buildMapping(null, inTypes, outTypes);

        SchemaMapping mapping = Utils.getSchemaMapping(inTypes, outTypes);
        return new SchemaAnalyzer(mapping);
    }
    public static SchemaMapping getSchemaMapping(RecordClassDescriptor[] inTypes, RecordClassDescriptor[] outTypes) {
        return new SchemaMapping();
//        ClassMappings classMappings = new ClassMappings();
//        SchemaMapping mapping = SchemaMigrator.getMapping(classMappings, new RecordClassSet(outTypes), new RecordClassSet(inTypes));
//        return new SchemaUpdater(classMappings).buildMapping(mapping, inTypes, outTypes);
    }
//
//    private static SchemaMapping getSchemaMapping(SchemaMapping mapping, RecordClassDescriptor[] inTypes, RecordClassDescriptor[] outTypes) {
//        if (inTypes == null)
//            throw new IllegalArgumentException("input types cannot be null");
//
//        if (outTypes == null)
//            throw new IllegalArgumentException("output types cannot be null");
//
//        ClassMappings classMappings = new ClassMappings();
//
//        RecordClassSet set = new RecordClassSet(outTypes);
//        HashMap<String, RecordClassDescriptor> map = new HashMap<>();
//
//        for (ClassDescriptor cd : set.getClassDescriptors()) {
//            if (cd instanceof RecordClassDescriptor)
//                map.put(cd.getName(), (RecordClassDescriptor)cd);
//        }
//
//        for (RecordClassDescriptor inType : inTypes) {
//            String name = inType.getName();
//            String classMapping = classMappings.getClassName(name);
//            if (classMapping != null) {
//                RecordClassDescriptor rcd = map.get(classMapping);
//                if (rcd == null)
//                    throw new IllegalStateException("Could not find Class Descriptor for " + name  + " using new mapping " + classMapping);
//                mapping.descriptors.put(inType.getGuid(), rcd.getGuid());
//            }
//        }
//
//        return mapping;
//    }
//
    public static RecordClassDescriptor findType(RecordClassDescriptor[] types, RecordClassDescriptor type) {
//        ClassMappings classMappings = new ClassMappings();
        String name = type.getName();

        for (RecordClassDescriptor cd : types) {
            if (type.getName().compareTo(cd.getName()) == 0)
                return cd;

            if (name != null && name.compareTo(cd.getName()) == 0)
                return cd;
        }

        return null;
    }

}
