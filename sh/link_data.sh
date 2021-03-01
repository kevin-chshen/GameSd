#!/bin/bash
# author : linjs
# 2020/04/02 16:07
# 将策划导出的文件连接到服务端目录

cd ../../
BASE_DIR=`pwd`

# 连接config/data目录
ln -s $BASE_DIR/data/data $BASE_DIR/server/config/data

# 连接export文件
ln -s $BASE_DIR/data/constant $BASE_DIR/server/app/constant/export
