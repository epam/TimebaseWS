FROM amazoncorretto:11-alpine3.17

COPY ws-server /ws-server
WORKDIR /ws-server

EXPOSE 8099
ENTRYPOINT ["/bin/sh", "-c", "java ${JAVA_OPTS} -cp . -jar timebase-ws-server-*.jar"]

HEALTHCHECK CMD wget --tries=1 --spider http://localhost:8099/ping || exit 1