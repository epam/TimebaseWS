#!/bin/bash
if [ -z $1 ]; then
	echo "Expected user name positional argument."
	exit 1
fi
qsrv_home="/home/$1/deltix_home/qsrv"
java -Ddeltix.qsrv.home="$qsrv_home" -cp deltix-timebase-server-5.3.4-all.jar deltix.qsrv.comm.cat.TBServerCmd