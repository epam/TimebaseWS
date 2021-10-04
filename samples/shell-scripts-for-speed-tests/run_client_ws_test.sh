#!/bin/bash
if [ -z $1 ]; then
	echo "Expected url positional argument."
	exit 1
fi
if [ -z $2 ]; then
	echo "Expected clients_number positional argument."
	exit 1
fi
java -cp deltix-timebase-ws-server-0.2.3-all.jar deltix.tbwg.webapp.utils.WSTest -url $1 -clients $2