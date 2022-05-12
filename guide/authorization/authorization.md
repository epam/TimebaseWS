# TimeBase Web Administrator Authorization

SSO providers may not support permissions for users. To cover this, TimeBase Web Admin allows defining permissions for users in `application.yaml` config in section `users` or in a JSON file. 

**Supported permissions:**

* `TB_ALLOW_READ` - user can select, view, get data stored in TimeBase streams. 
* `TB_ALLOW_WRITE` - user can write, modify, delete data stored in TimeBase streams. 
* `GRAFANA` - permission allowing Grafana plugin to query data from TimeBase. 

```yaml
# Example how you can define permissions for users in config file. 

# Built-in OAuth2 authentication 

security:
  oauth2:
    ...
    users:
      - username: <username>
        password: <password>
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
      - username: <username>
        password: <password>
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]

# SSO 

security:
  oauth2:
    ...
    users:
      - username: <username>
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
      - username: <username>
        authorities: [TB_ALLOW_READ]
```

> Refer to [standard configuration](https://github.com/epam/TimebaseWS/blob/304ec8094ab70c59042f49e25d065739fb226560/java/ws-server/src/main/resources/application.yaml#L28).

You can also define permissions for users in a JSON file:

```yaml
security:
  authorization:
    source: FILE # valid values: FILE, CONFIG
    file-source:
      path: /path/to/tbwg.users.json
```

`tbwg.users.json` example:

```json
{
  "users" : [ {
    "username" : "username",
    "password" : "user password",
    "authorities" : [ "TB_ALLOW_READ", "TB_ALLOW_WRITE", "GRAFANA" ]
  }, {
    "username" : "username",
    "password" : "user password",
    "authorities" : [ "TB_ALLOW_READ", "TB_ALLOW_WRITE", "GRAFANA" ]
  } ]
}
```
