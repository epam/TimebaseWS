#!/bin/bash
if [ -z $1 ]; then
	echo "Expected acrhive-name positional argument."
	exit 1
fi
sudo apt-get install unzip
unzip "$1"
chmod 755 run_client_ws_test.sh
chmod 755 run_client_api_test.sh