# TimeBase Web Administrator Deployment

As a TimeBase Server management tool, Web Admin can be deployed and run as a standalone web application or embedded into TimeBase Server. 

**Supported web browsers:**

* Chrome 72+
* Firefox 65+
* Safari

## Docker

1. [Install Docker](https://docs.docker.com/get-docker/) 
2. [Start TimeBase Server](https://kb.timebase.info/quick-start.html)
3. Run Docker container with [TimeBase WS Server](https://hub.docker.com/r/epam/timebase-ws-server)


```bash
# Community edition example
docker run --rm -d \ 
    --name timebase-admin \ 
    -p 8099:8099 \ 
    -e "JAVA_OPTS=-Dtimebase.url=dxtick://HOST_PORT" \
    epam/timebase-ws-server:latest
```


## Orchestration

Use Docker Compose to deploy more than one instance of the Web Admin application. 


```yaml
# Example of running TimeBase Admin in Docker Compose for Community Edition 

docker-compose.yml:

  timebase-admin:
    image: "epam/timebase-ws-server:latest"
    network_mode: host

docker-compose.override.yml:

  timebase-admin:
    environment:
      - JAVA_OPTS=-Dserver.port=8099 -Dtimebase.url=dxtick://localhost:8011
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8099/ping"]

```

[Share Compose configurations between files and projects](https://docs.docker.com/compose/extends/).
