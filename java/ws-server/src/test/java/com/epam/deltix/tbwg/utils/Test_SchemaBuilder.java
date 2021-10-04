package com.epam.deltix.tbwg.utils;

import com.epam.deltix.qsrv.hf.pub.md.ClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.Introspector;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.timebase.messages.service.StreamTruncatedMessage;
import com.epam.deltix.tbwg.model.schema.SchemaBuilder;
import com.epam.deltix.tbwg.model.schema.SchemaDef;
import org.junit.Test;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;


/**
 * Created by Alex Karpovich on 27/11/2020.
 */
public class Test_SchemaBuilder {

    @Test
    public void test() throws Introspector.IntrospectionException {
        Introspector it = Introspector.createCustomIntrospector();
        RecordClassDescriptor descriptor = it.introspectRecordClass(StreamTruncatedMessage.class);

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
