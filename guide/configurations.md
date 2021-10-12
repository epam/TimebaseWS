# TimeBase Web Administrator Configurations

Provide this configuration with Web Admin `application.yaml`. 

```yaml
# application.yaml example

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
```