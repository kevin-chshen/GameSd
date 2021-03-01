#!/bin/sh
#手游服务端发布脚本

case "$1" in
    "")
        echo "发布dev版"
        BRANCH=dev
        PLATFORM=android_cn
        ;;
    dev)
        echo "发布dev版"
        BRANCH=dev
        PLATFORM=android_cn
        ;;
    beta)
        echo "发布beta版"
        BRANCH=beta
        PLATFORM=android_cn
        ;;
    stable)
        echo "发布stable版"
        BRANCH=stable
        PLATFORM=android_cn
        ;;
    *)
        echo "参数输入错误，只支持dev,beta,stable或者不输入"
        exit 1
        ;;
esac

echo ${BRANCH} ${PLATFORM}
sleep 5

# 更新一下服务端代码和配置文件
sh update.sh ${BRANCH} release

cd ../..

cp -f server/config/production/master.json server/config/production/master_example.json
cp -f server/config/production/servers.json server/config/production/servers_example.json
cp -f server/config/production/system.json server/config/production/system_example.json
cp -f server/config/development/master.json server/config/development/master_example.json
cp -f server/config/development/servers.json server/config/development/servers_example.json
cp -f server/config/development/system.json server/config/development/system_example.json

if [ "$2" == "all" ]; then
# 打初始化包,需要把node_modules也打包进去
tar --exclude-vcs -czvhf server.tar.gz server/app server/config/data server/config/production server/config/development server/config/*.json server/node_modules server/sh server/sql server/app.js server/context.json server/package.json server/jsconfig.json server/pomelo.sh --exclude="*.tar.gz" --exclude="master.json" --exclude="servers.json" --exclude="system.json"
else
# 打release包,不需要node_modules
tar --exclude-vcs -czvhf server.tar.gz server/app server/config/data server/config/production server/config/development server/config/*.json server/sh server/sql server/app.js server/context.json server/package.json server/jsconfig.json server/pomelo.sh --exclude="*.tar.gz" --exclude="master.json" --exclude="servers.json" --exclude="system.json"
fi

if [ ! -d "/data/wpbz/server/CN/${BRANCH}/${PLATFORM}" ]; then
    mkdir -p /data/wpbz/server/CN/${BRANCH}/${PLATFORM}
fi

# 清理一波发版目录,防止删掉的beam文件还留在目录中
if [ "${BRANCH}" == 'dev' ];then
    # dev版本要借用beta版本的,所以也要一并清除
    if [ "$2" == "all" ]; then
    rm -rf /data/wpbz/server/CN/dev/${PLATFORM}/*
    rm -rf /data/wpbz/server/CN/beta/${PLATFORM}/*
    else
    find /data/wpbz/server/CN/dev/${PLATFORM}/* | grep -v node_modules | xargs rm -rf
    find /data/wpbz/server/CN/beta/${PLATFORM}/* | grep -v node_modules | xargs rm -rf
    fi
else
    # beta和stable版本要解压一下
    if [ "$2" == "all" ]; then
    rm -rf /data/wpbz/server/CN/${BRANCH}/${PLATFORM}/*
    else
    find /data/wpbz/server/CN/${BRANCH}/${PLATFORM}/* | grep -v node_modules | xargs rm -rf
    fi
fi

# 把包复制到对应的存放路径
mv -f server.tar.gz /data/wpbz/server/CN/${BRANCH}/${PLATFORM}

# 发布版本还要在发版目录解压一遍更新ebin目录
if [ "${BRANCH}" == 'dev' ];then
    # 目前只支持beta和stable版本,所以把dev复制到beta进行展开
    cp -f /data/wpbz/server/CN/dev/${PLATFORM}/server.tar.gz /data/wpbz/server/CN/beta/${PLATFORM}
    cd /data/wpbz/server/CN/beta/${PLATFORM}
    tar -xf server.tar.gz --strip-components 1
else
    # beta和stable版本要解压一下
    cd /data/wpbz/server/CN/${BRANCH}/${PLATFORM}
    tar -xf server.tar.gz --strip-components 1
fi
