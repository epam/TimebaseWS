# TimeBase Web Administrator Configuration

TimeBase Web Administrator is a Spring application. You can follow standard best practices to configuring Spring applications properties, such as:

* Via application.yaml
* Via environment variables
* Via Java system properties 

> Refer to [Spring Documentation](https://docs.spring.io/spring-boot/docs/2.1.9.RELEASE/reference/html/boot-features-external-config.html).

> Refer to [Spring Documentation](https://docs.spring.io/spring-boot/docs/1.2.0.M1/reference/html/howto-properties-and-configuration.html).

## Configuration Guidelines

TimeBase Web Administrator starts with the default configuration specified in the application.yaml file.

> Refer to [Default Configuration](https://github.com/epam/TimebaseWS/blob/main/java/ws-server/src/main/resources/application.yaml).

You can use it as it is, or follow the suggested best practices to edit the application behavior to meet your specific requirements. 

### Redefine the Default Configuration Parameters

You can redefine the selected configuration parameters. The rest of the parameters will keep their default values. There are several ways to do that. 

#### Additional Config

Using an **additional** application.yaml configuration file.

For example, to redefine the default TimeBase URL, you can add an additional application.yaml configuration file as shown in the below example: 

```yaml
# create an additional application.yaml file to redefine the default TimeBase url
timebase:
  url: dxtick://localhost:8011
```

In the **additional** application.yaml, all you need is to specify the application properties you want to redefine, other (not specified in the additional config) properties will keep their default values. In this case, run the application with [spring.config.additional-location](https://docs.spring.io/spring-boot/docs/2.1.9.RELEASE/reference/html/boot-features-external-config.html#:~:text=Alternatively%2C%20when%20custom,becomes%20the%20following%3A) option and provide the path to the additional application.yaml you want to use. 

```yaml
# docker-compose snippet example
    environment:
      - JAVA_OPTS=
        -Dspring.config.additional-location=path to the additional config
```

#### System Properties 

Default configuration parameters can be mapped on and redefined in Java System Properties.

For example, to redefine the default TimeBase URL, you can add a system property as shown in the below example: 

```yaml
# docker-compose snippet example
    environment:
      - JAVA_OPTS=
        -Dtimebase.url=new TimeBase url
```

#### Environment Variables

Default configuration parameters can be redefined in Environment Variables.

> Refer to [Spring Naming Convention](https://docs.spring.io/spring-boot/docs/2.1.9.RELEASE/reference/html/boot-features-external-config.html#boot-features-external-config-relaxed-binding) for your reference. 

```yaml
# docker-compose snippet example
    environment:
      TIMEBASE_URL=new TimeBase url
```

### Replace the Default Configuration 

You can ignore the default configuration and entirely replace it by the **custom** application.yaml. In this case, run the application with [spring.config.location](https://docs.spring.io/spring-boot/docs/2.1.9.RELEASE/reference/html/boot-features-external-config.html#:~:text=When%20custom%20config%20locations%20are%20configured%20by%20using%20spring.config.location%2C%20they%20replace%20the%20default%20locations.%20For%20example%2C%20if%20spring.config.location%20is%20configured%20with%20the%20value%20classpath%3A/custom%2Dconfig/%2Cfile%3A./custom%2Dconfig/%2C%20the%20search%20order%20becomes%20the%20following%3A) option and provide the path to the new application.yaml you want to use instead of the default one. 

Be aware, that in this case, you will have to create the entire config from scratch, which is significantly more resourceful than redefining the selected parameters - described in the above sections. 

```yaml
# docker-compose snippet example
    environment:
      - JAVA_OPTS=
        -Dspring.config.location=path to the config file
```

### Examples 

Redefine TimeBase connection parameters in the additional application.yaml file:

```yaml
# create an additional application.yaml file to redefine the default TimeBase parameters
timebase:
  url: new TimeBase URL
  user: <username>
  password: <BCrypt_encoded_password>
```

Configure users by adding an additional application.yaml: 

```yaml
# additional application.yaml to configure users
security:
  oauth2:
    users:
      - username: admin
        password: <BCrypt_encoded_password>
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
```

Configure ORY Hydra SSO provider in the additional application.yaml:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: Service provider URI

security:
  oauth2:
    provider:
      providerType: SSO
      name: hydra
      clientId: <client_id>
      validateIssuer: false
      userInfo:
        enable: true
    users:
      - username: <username>
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
      - username: <username>
        authorities: [TB_ALLOW_READ]
```

Configure users via Java System Properties: 

```yaml
# docker-compose snippet example
    environment:
      - JAVA_OPTS=
        -Dsecurity.oauth2.users.0.username=admin
        -Dsecurity.oauth2.users.0.authorities.0=TB_ALLOW_READ
        -Dsecurity.oauth2.users.0.authorities.1=TB_ALLOW_WRITE
```

Configure users via Environment Variables: 

```yaml
# docker-compose snippet example
    environment:
      SECURITY_OAUTH2_USERS_0_USERNAME=admin
      SECURITY_OAUTH2_USERS_0_AUTHORITIES_0=TB_ALLOW_READ
      SECURITY_OAUTH2_USERS_0_AUTHORITIES_1=TB_ALLOW_WRITE
```