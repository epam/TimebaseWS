FROM amazoncorretto:17-alpine3.21

COPY ws-server /ws-server
WORKDIR /ws-server

ENV JAVA_DEFAULT_OPTS=--add-opens=java.base/jdk.internal.misc=ALL-UNNAMED --add-opens=java.rmi/sun.rmi.transport=ALL-UNNAMED --add-opens=java.base/java.lang=ALL-UNNAMED

EXPOSE 8099
ENTRYPOINT ["/bin/sh", "-c", "java ${JAVA_DEFAULT_OPTS} ${JAVA_OPTS}  -cp . -jar timebase-ws-server-*.jar"]

HEALTHCHECK CMD wget --tries=1 --spider http://localhost:8099/ping || exit 1