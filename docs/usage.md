### Build and Deploy

1. build Timebase Web Gateway distribution
```
  gradlew :java:ws-server:distribution
```
2. deploy zip file on server
```
  timebase/ws-server/deltix-timebase-ws-server-distribution.zip
```
3. start timebase web gateway
```
   java -jar timebase/webapp/deltix-timebase-ws-server-0.3.10.jar
```

   1. To override server port and timebase connection change appropriate application.yaml properties. Timebase password should be Base64 encoded.
   2. to use oauth-server authentication application.yaml should have
```yaml   
	oauth2:
	  enabled: true
	  checkTokenEndpointUrl: http://localhost:8100/oauth/check_token
	  clientId: timebase-web
	  clientSecret: qwfCVyb9rB
```   
   3. to use AXA authentication (public server)
```yaml
	   oauth2:
		 enabled: true
	     checkTokenEndpointUrl: http://axa-qa.algocompass.net/oauth/check_token
	     clientId: timebase-web
	     clientSecret: qwfCVyb9rB
```

### Configuration

Timebase Gateway yaml settings:
```yaml
server:
  port: 8099 # http port of Timebase Gateway
  compression:
    enabled: true
    mime-types: text/html,text/css,application/javascript,application/json
timebase: # timebase settings definition
  url: dxtick://localhost:8011 # connection URL
  user: # user name, if UAC is enabled
  password: # user password, if UAC is enabled
  streams: # stream filter
    include: # a regular expression to include stream keys
             # for example: GRAX|BITMEX - include only GDAX and BITMEX streams
             # for example: ticks*
    exclude: # a regular expression to exclude stream keys                 
             # for example: \#$ - exclude all streams ends with #
             # for example: ticks* - exclude all streams starts with 'ticks'
  readonly: true # enables 'readonly' mode for timebase to prevent any modifications
oauth2: # authentication settings
  enabled: false # enable/disable authentication
  checkTokenEndpointUrl: http://localhost:8100/oauth/check_token # oauth2 server enpoint
  clientId: timebase-web # oauth2 server client id
  clientSecret: qwfCVyb9rB # oauth2 server client secret
```

### How to use

User authorize within oauth-server (local server or AXA server) and then will use this token to obtain data from Timebase Gateway application. Timebase Gateway will query oauth-server (local server or AXA server) for token verification. All endpoints except for /ping require the user to be authenticated, /ping is unprotected. Some endpoints require additional roles to be assigned to the user.
Both servers has predefined users:

user: tb-write, password: write (contains authorities TB_ALLOW_READ, TB_ALLOW_WRITE)<br/>
user: tb-read, password: read (contains authority TB_ALLOW_READ)

To work with Timebase Web Gateway endpoints you need to:<br>
setup <oauth-server> = http://localhost:8100/ or http://axa-qa.algocompass.net/

1. Obtain token from oauth-server <server> for read-write user

```
POST <oauth-server>/oauth/token
Authorization: Basic d2ViYXBwOg==
Content-Type: application/x-www-form-urlencoded
username=tb-write&password=write&grant_type=password&scope=public

RESPONSE:
	"access_token": "2e0a56a8-c080-452d-996b-8cdb967acc1e",
    "token_type": "bearer",
    "refresh_token": "d0d0139f-a06a-485d-99d1-3dc5655865ca",
    "expires_in": 600,
    "scope": "public internal"
```

To call any web endpoint use retrieved token in request headers
```
GET http://localhost:8099/api/v0/streams
Authorization: bearer 2e0a56a8-c080-452d-996b-8cdb967acc1e
```

### Docker Support

1. To build and publish Timebase Web Gateway docker image, run on the docker host:
```
gradlew dockerPublishImage
```
Docker tasks use DOCKER_REGISTRY_URL, PUBLISHER_USERNAME and PUBLISHER_PASSWORD properties to login to docker.
DOCKER_REGISTRY_URL is set to "packages.deltixhub.com" by default and can be overridden via a system property.
PUBLISHER_USERNAME and PUBLISHER_PASSWORD are searched in gradle properties first and can be specified in ~/.gradle/gradle.properties file.

2. To create a container:

On the docker host create application.yaml config file as described in Configuration section above.
Execute docker command that runs the container and replace default file in in the container with your application.yaml using --volume or --mount option.
If using default 8099 server port in application.yaml the command can look like this:
```
docker run -d -v /<docker-host-path>/application.yaml:/opt/deltix/timebase/ws-server/application.yaml --name ws-server-test -p 8099:8099  --health-cmd='curl --fail http://localhost:8099/ping || exit 1'  packages.deltixhub.com/quantserver.docker/timebase/ws-server:0.3.3
```
Where docker-host-path is path to application.yaml on the docker host. If using a different server port in application.yaml, make sure to expose this port with -p option and also update the port specified in healthcheck command.
