#!/bin/sh
#手游服务端更新脚本

BRANCH=${1}

case "$1" in
    "")
        echo "更新dev版"
        BRANCH=dev
        ;;
    dev)
        echo "更新dev版"
        BRANCH=dev
        ;;
    beta)
        echo "更新beta版"
        BRANCH=beta
        ;;
    stable)
        echo "更新stable版"
        BRANCH=stable
        ;;
    *)
    echo "参数输入错误，只支持dev,beta,stable或者不输入"
    exit 1
    ;;
esac

#宏变量定义
BASE_DIR=`pwd`

SRC_DIR=../
CFG_DIR=../../data/

SVN=svn

#记录更新日志
${SVN} cleanup
${SVN} log $SRC_DIR -r HEAD:BASE > svn.log
${SVN} log $CFG_DIR -r HEAD:BASE >> svn.log

${SVN} update "$SRC_DIR" --accept theirs-full
${SVN} update "$CFG_DIR" --accept theirs-full

cd ${BASE_DIR}

#打印更新日志文件
echo
echo ******更新内容******
sort -n svn.log | grep -v '^------' | grep -v line |uniq
echo
echo ******更新内容完******
echo
rm -f svn*.log
