#!/bin/bash
java -cp deltix-timebase-ws-server-0.2.3-all.jar deltix.tbwg.webapp.utils.SpeedTestStream -stream speed.test.api -messages 100000000
java -cp deltix-timebase-ws-server-0.2.3-all.jar deltix.tbwg.webapp.utils.SpeedTestStream -stream speed.test.ws -messages 1000000