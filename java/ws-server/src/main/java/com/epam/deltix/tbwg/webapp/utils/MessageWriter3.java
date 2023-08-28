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
package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.qsrv.hf.codec.MessageSizeCodec;
import com.epam.deltix.qsrv.hf.pub.TypeLoader;
import com.epam.deltix.qsrv.hf.pub.codec.CodecFactory;
import com.epam.deltix.qsrv.hf.pub.codec.FixedBoundEncoder;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.util.SerializationUtils;
import com.epam.deltix.qsrv.hf.stream.AbstractMessageWriter;
import com.epam.deltix.qsrv.hf.stream.Protocol;
import com.epam.deltix.streaming.MessageChannel;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.util.memory.MemoryDataOutput;
import com.epam.deltix.util.time.Interval;

import java.io.*;

public class MessageWriter3 extends AbstractMessageWriter implements MessageChannel<InstrumentMessage> /*, Closeable, Flushable */ {
    private final OutputStream out;
    protected final MemoryDataOutput buffer = new MemoryDataOutput(4096);

    public MessageWriter3(OutputStream out,
                          Interval periodicity,
                          TypeLoader loader,
                          boolean convertNamespaces,
                          RecordClassDescriptor... descriptors)
        throws IOException, ClassNotFoundException {
        this(out,
            periodicity,
            loader,
            CodecFactory.COMPILED,
            convertNamespaces,
            descriptors);
    }

    public MessageWriter3(OutputStream out,
                          Interval periodicity,
                          TypeLoader loader,
                          CodecFactory codecFactory,
                          boolean convertNamespaces,
                          RecordClassDescriptor... descriptors)
        throws IOException, ClassNotFoundException {
        this.out = out;

        for (RecordClassDescriptor rcd : descriptors) {
            if (loader != null) {
                Class<?> clazz = loader.load(rcd);
                FixedBoundEncoder encoder =
                    codecFactory.createFixedBoundEncoder(loader, rcd);
                addNew(rcd, clazz, encoder);
            } else {
                addNew(rcd, null, null);
            }
        }

        if (convertNamespaces) {
            MessageWriter3.convertAndWriteHeader(out, periodicity, getTypes());
        } else {
            AbstractMessageWriter.writeHeader(out, periodicity, getTypes());
        }
    }

    public void close() {
        try {
            out.close();
        } catch (IOException e) {
            throw new com.epam.deltix.util.io.UncheckedIOException(e);
        }
    }

    public void flush() throws IOException {
        out.flush();
    }

    public void send(InstrumentMessage msg) {
        try {
            encode(msg, buffer);
            final int size = buffer.getSize();

            if (out != null) {
                MessageSizeCodec.write(size, out);
                out.write(buffer.getBuffer(), 0, size);
            }
        } catch (IOException e) {
            throw new com.epam.deltix.util.io.UncheckedIOException(e);
        }
    }

    protected static void convertAndWriteHeader(OutputStream out, Interval periodicity, RecordClassDescriptor[] types)
        throws IOException
    {
        out.write(Protocol.MAGIC);
        out.write(Protocol.VERSION);

        // write schema to temp buffer
        String xml;
        try (ByteArrayOutputStream schemaBuffer = new ByteArrayOutputStream()) {
            Protocol.writeTypes(new DataOutputStream(schemaBuffer), types);

            xml = readSchema(
                new DataInputStream(new ByteArrayInputStream(schemaBuffer.toByteArray()))
            );
        }

        xml = xml.replaceAll("com.epam.deltix.timebase.messages.", "deltix.timebase.api.messages.");
        xml = xml.replaceAll("com.epam.deltix.", "deltix.");
        xml = xml.replaceAll("(?s)<tags>.*?</tags>", "");

        DataOutputStream dout = new DataOutputStream(out);
        writeSchema(dout, xml);
        dout.writeBoolean(periodicity != null);
        if (periodicity != null) {
            dout.writeUTF(periodicity.toString());
        }
    }

    private static String readSchema(DataInputStream din) throws IOException {
        String xml = din.readUTF ();
        if (xml.length() == 0) {
            StringBuilder sb = new StringBuilder();
            SerializationUtils.readHugeString(din, sb);
            xml = sb.toString();
        }

        return xml;
    }

    private static void writeSchema(DataOutputStream dout, String xml) throws IOException {
        if (xml.length() < 65535) {
            dout.writeUTF(xml);
        } else {
            dout.writeUTF("");
            SerializationUtils.writeHugeString(dout, xml);
        }
    }
}
