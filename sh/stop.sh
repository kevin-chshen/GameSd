#!/bin/bash
ENV=${1}
case $1 in
	"")
		ENV="production"
	;;
esac
echo stop ${ENV}

MASTER_PORT=`cat ../config/${ENV}/master.json|grep "port"|cut -d: -f4|cut -d\  -f2`

cd ..

sh pomelo.sh stop --port $MASTER_PORT
