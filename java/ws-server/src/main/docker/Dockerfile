FROM artifactory.epam.com:6190/thirdparty.docker/alpine-c-jdk:11.0.13_p8-r0-alpine3.15.0

COPY ws-server /opt/deltix/timebase/ws-server

ENV JAVA_OPTS=-verbose:gc
WORKDIR /opt/deltix/timebase/ws-server

EXPOSE 8099
ENTRYPOINT ["/bin/sh", "-c", "java ${JAVA_OPTS} -cp . -jar deltix-timebase-ws-server-*.jar"]

HEALTHCHECK CMD wget --tries=1 --spider http://localhost:8099/ping || exit 1