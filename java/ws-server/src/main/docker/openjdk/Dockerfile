FROM openjdk:11

COPY ws-server /opt/deltix/timebase/ws-server

ENV JAVA_OPTS=-verbose:gc
WORKDIR /opt/deltix/timebase/ws-server

EXPOSE 8099
ENTRYPOINT ["/bin/sh", "-c", "java ${JAVA_OPTS} -cp . -jar deltix-timebase-ws-server-*.jar"]

HEALTHCHECK CMD curl --fail http://localhost:8099/ping || exit 1
