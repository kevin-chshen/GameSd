#!/bin/bash

ulimit -n 102400

ENV=${1}
case $1 in
	"")
		ENV="production"
	;;
esac
echo start ${ENV}
cd ..
sh pomelo.sh start --env=${ENV} --daemon
