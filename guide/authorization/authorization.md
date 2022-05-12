# TimeBase Web Administrator Authorization

Users authorization can be configured in TimeBase Web Admin `application.yaml` config in section `users`. 

```yaml

# Built-in OAuth2 authentication 
users: # list of users with its authorities
    - username: <username>
      password: <BCrypt_encoded_password>
      authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]

# SSO 
users:
      - username: <username>
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
      - username: <username>
        authorities: [TB_ALLOW_READ]
```

You can also use external file to configure permissions for users:

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
## Permissions

* `TB_ALLOW_READ` - user can select data from TimeBase. 
* `TB_ALLOW_WRITE` - user can write into TimeBase streams. 
* `GRAFANA` - permission allowing Grafana plugin to query data from TimeBase. 
