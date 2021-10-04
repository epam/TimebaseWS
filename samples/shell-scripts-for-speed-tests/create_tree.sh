#!/bin/bash
if [ -z $1 ]; then
	echo "Expected acrhive-name positional argument."
	exit 1
fi
mkdir data
mkdir deltix_home
cd deltix_home
mkdir qsrv
cd ..
sudo apt-get install unzip
unzip "$1" -d ./data
mv data/inst.properties deltix_home/
chmod 755 data/run_timebase.sh
chmod 755 data/create_test_streams.sh
chmod 755 data/run_ws_server.sh