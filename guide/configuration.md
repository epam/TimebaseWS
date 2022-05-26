# TimeBase Web Administrator Configuration

TimeBase Web Administrator is a Spring application. You can follow standard best practices to configuring Spring applications properties, such as:

* [Via additional application.yaml](#additional-configuration-file)
* [Via Java system properties](#system-properties)
* [Via environment variables](#environment-variables)

> Refer to [Spring Documentation](https://docs.spring.io/spring-boot/docs/2.1.9.RELEASE/reference/html/boot-features-external-config.html).

> Refer to [Spring Documentation](https://docs.spring.io/spring-boot/docs/1.2.0.M1/reference/html/howto-properties-and-configuration.html).

TimeBase Web Administrator starts with the default configuration specified in the application.yaml file.

> Refer to [Default Configuration](https://github.com/epam/TimebaseWS/blob/main/java/ws-server/src/main/resources/application.yaml).

You can override specific default configuration parameters (in this case other parameters keep their default values) or the entire default configuration to meet your specific requirements. 

## Additional Configuration File

You can create an **additional** application.yaml configuration file to **override** the selected configuration parameters.

For example, to override the default TimeBase URL, you can create an **additional** application.yaml configuration file as shown in the example below: 

```yaml
# additional application.yaml
timebase:
  url: dxtick://localhost:8045
```
and run the application with [-Dspring.config.additional-location](https://docs.spring.io/spring-boot/docs/2.1.9.RELEASE/reference/html/boot-features-external-config.html#:~:text=Alternatively%2C%20when%20custom,becomes%20the%20following%3A) system property, where you provide the path to the additional application.yaml you want to use. 

```yaml
# docker-compose.yaml
services:
  timebase-admin:
    environment:
      - JAVA_OPTS=
        -Dspring.config.additional-location=/path/to/the/additional/config file/application.yaml
```
or add the edditional configuration file using environment variable:

```yaml
# docker-compose.yaml
services:
  timebase-admin:
    environment:
      - SPRING_CONFIG_ADDITIONAL-LOCATION=/path/to/the/additional/config file/application.yaml
```

## System Properties 

Default configuration parameters can be mapped on and overridden using Java system properties.

For example, to **override** the default TimeBase URL, you can add a system property as shown in the below example: 

```yaml
# docker-compose.yaml
services:
  timebase-admin:
    environment:
      - JAVA_OPTS=
        -Dtimebase.url=dxtick://localhost:8045
```

## Environment Variables

Default configuration parameters can be overridden using environment variables.

> Refer to [Spring Naming Convention](https://docs.spring.io/spring-boot/docs/2.1.9.RELEASE/reference/html/boot-features-external-config.html#boot-features-external-config-relaxed-binding) for your reference. 

```yaml
# docker-compose.yaml
services:
  timebase-admin:
    environment:
      - TIMEBASE_URL=dxtick://localhost:8045
```

## Replace the Default Configuration 

You can ignore the default configuration and entirely replace it by the **custom** application.yaml. In this case, run the application with [-Dspring.config.location](https://docs.spring.io/spring-boot/docs/2.1.9.RELEASE/reference/html/boot-features-external-config.html#:~:text=When%20custom%20config%20locations%20are%20configured%20by%20using%20spring.config.location%2C%20they%20replace%20the%20default%20locations.%20For%20example%2C%20if%20spring.config.location%20is%20configured%20with%20the%20value%20classpath%3A/custom%2Dconfig/%2Cfile%3A./custom%2Dconfig/%2C%20the%20search%20order%20becomes%20the%20following%3A) system property and provide the path to the new application.yaml you want to use instead of the default one. 

Be aware, that in this case, you will have to create the entire config from scratch, which is significantly more resourceful than redefining the selected parameters - described in the above sections. 

```yaml
# docker-compose.yaml
services:
  timebase-admin:
    environment:
      - JAVA_OPTS=
        -Dspring.config.location=/path/to/the/config file/application.yaml
```

## Examples 

Override TimeBase connection parameters in the additional application.yaml file:

```yaml
# additional application.yaml
timebase:
  url: dxtick://localhost:8045
  user: admin
  password: admin
```

Configure users by adding an additional application.yaml: 

```yaml
# additional application.yaml
security:
  oauth2:
    users:
      - username: admin
        password: admin # or BCrypt encoded password
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
```

Configure ORY Hydra SSO provider in the additional application.yaml:

```yaml
# additional application.yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://hydra-url:8011/my-client-id

security:
  oauth2:
    provider:
      providerType: SSO
      name: hydra
      clientId: my-hydra-client-id
      validateIssuer: false
      userInfo:
        enable: true
```

Configure users via Java system properties: 

```yaml
# docker-compose.yaml
services:
  timebase-admin:
    environment:
      - JAVA_OPTS=
        -Dsecurity.oauth2.users.0.username=admin
        -Dsecurity.oauth2.users.0.password=admin
        -Dsecurity.oauth2.users.0.authorities=[TB_ALLOW_READ, TB_ALLOW_WRITE]
```

Configure API Keys via environment variables: 

```yaml
# docker-compose.yaml
services:
  timebase-admin:
    environment:
      - SECURITY_AUTHORIZATION_SOURCE=CONFIG
      - SECURITY_API-KEYS_SESSIONS_ENABLED=false
      - SECURITY_API-KEYS-PROVIDER_API-KEYS_0_NAME=TEST_API_KEY
      - SECURITY_API-KEYS-PROVIDER_API-KEYS_1_KEY=TEST_API_SECRET
      - SECURITY_API-KEYS-PROVIDER_API-KEYS_2_USER=admin
      - SECURITY_API-KEYS-PROVIDER_API-KEYS_3_AUTHORITIES=[TB_ALLOW_READ, TB_ALLOW_WRITE]
```