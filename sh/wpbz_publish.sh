####################################################
#!/bin/sh
#目标：上传更新文件到线上服务器
#修改：PGL 2016-03-16
####################################################
 
PRO=wpbz
TYPE=$1
branch=$2
VER=$3
AGENT=$4

#####################
# 帮助
####################
Help () {
echo  "\033[1;31;1m
        sh $0 server CN stable android_cn
        [[ ${PRO}自动发布工具 v1.1 ]]
        
        ====================================================
        在本地创建程序版本目录，并把程序存放至对应目录
        mkdir -p /data/wpbz/{server,client,cdn}/CN/{dev,beta,stable}/{android_cn,ios_cn,mix_cn}
    
        + 发版约定目录【请将需要发版的程序，存放至本地的如下目录，然后执行此脚本进行发版，发版后只是发至外网版属机s0的临时目录，需要进一步在蓝海上进行相关操作】:
        ====================================================
        程序目录: /data/${PRO}/server/
        cdn目录: /data/${PRO}/cdn/
        client目录：/data/${PRO}/client/
        ====================================================
        + 使用说明:
        ====================================================
        请把需要发布的文件和目录拷贝到指定发版目录里，然后执
        行'${PRO}pub'发布命令。一般发版含有以上三种类型，请带
        相关类型参数即可。目前只有一个版本，参数为stable即可。
        Usage: ${PRO}pub {发布类型} {版本号}
        - 发布命令: ${PRO}pub {server|client|cdn} CN {stable|beta|dev} {android_cn|ios_cn}
        ====================================================

		
        sh $0 server CN stable android_cn
        sh $0 client CN stable android_cn
        sh $0 cdn    CN stable android_cn
        \033[0m\n" 
   
}
 
############
# 传参判断
# $0 {server|client|cdn} {stable|beta|dev|ios} {CN|KR|TW|EN|TG}
############
if [ "$4" == "" ] ; then
        echo "参数错误！"
        Help 
        exit 1
fi

if [ ${branch} != 'CN' ] && [ ${branch} != 'KR' ] && [ ${branch} != 'TW' ] && [ ${branch} != 'EN' ] && [ ${branch} != 'TG' ];then
        echo "$branch 参数不正确！"
        Help
        exit 1 
fi

if [ ${VER} != 'stable' ] && [ ${VER} != 'beta' ] && [ ${VER} != 'dev' ];then
        echo "$VER 参数不正确！"
        Help
        exit 1
fi
############
# 定义变量
############
#版本分支
#TYPE=$1,branch=$2,VER=$3,AGENT=$4 
#源机IP
if [ "${branch}" == "CN" ];then
    	src_ip="120.31.141.138"
        if [ "$1" == "cdn" ];then
        src_ip="120.31.139.95"
        fi
fi

if [ "${branch}" == "KR" ];then
    src_ip="@KR_S0_IP"
    if [ "$1" == "cdn" ];then
        src_ip="@KR_CDN_IP"
    fi
    if [ "$1" == "apk" ];then
        src_ip="10.0.4.14"
    fi
fi

if [ "${branch}" == "EN" ];then
    src_ip="@EN_S0_IP"
    if [ "$1" == "cdn" ];then
        src_ip="@EN_CDN_IP"
    fi
fi

if [ "${branch}" == "TH" ];then
    src_ip="@TH_S0_IP"
    if [ "$1" == "cdn" ];then
        src_ip="@TH_CDN_IP"
    fi
fi

if [ "${branch}" == "US" ];then
    src_ip="@US_S0_IP"
    if [ "$1" == "cdn" ];then
        src_ip="@US_CDN_IP"
    fi
fi

if [ "${branch}" == "HK" ];then
    src_ip="@HK_S0_IP"
    if [ "$1" == "cdn" ];then
        src_ip="@HK_CDN_IP"
    fi
fi

#密文件
echo "d2txA9rNCxsLcXkFM8bVQN" > /tmp/rsync_${PRO}.pass
rsync_pw="/tmp/rsync_${PRO}.pass"
 
################
# 自动生成密文件
################
create_new_pw() {
if [ $(id -u) == "0" ]
then
RSY_NEW_PWD="/tmp/rsync_root_pwd"
else
RSY_NEW_PWD="/tmp/rsync_admin_pwd"
fi
cat ${rsync_pw} > ${RSY_NEW_PWD}
chmod 600 ${RSY_NEW_PWD}
}
 

upload_server() {
s_dir="/data/${PRO}/${TYPE}/${branch}/${VER}/${AGENT}"
#chown -R admin:admin "${s_dir}" 2>/dev/null
#chmod -R o-w "${c_dir}"
echo "---------------------------------------"
echo "--> 开始同步server文件 from : ${s_dir} >>> "
echo "---------------------------------------"
create_new_pw
if rsync -avhz  --delete  --exclude="*.svn" --exclude="*.DS_Store"  --exclude="*.swp" --password-file="${RSY_NEW_PWD}" ${s_dir}/ rsy_user@${src_ip}::${PRO}_server/${PRO}/${branch}/${VER}/${AGENT}/
then
echo "--> 文件同步成功！"
else
echo "--> 文件同步不成功！"
exit 1
fi
}
upload_client() {
s_dir="/data/${PRO}/${TYPE}/${branch}/${VER}/${AGENT}"
#chown -R admin:admin "${s_dir}" 2>/dev/null
#chmod -R o-w "${c_dir}"
echo "---------------------------------------"
echo "--> 开始同步client文件 from : ${s_dir} >>> "
echo "---------------------------------------"
create_new_pw
if rsync -avhz --delete --exclude={*.svn,*.erl,.DS_Store,res/}  --exclude="*.swp" --password-file="${RSY_NEW_PWD}" ${s_dir}/ rsy_user@${src_ip}::${PRO}_client/${PRO}/${branch}/${VER}/${AGENT}/
then
echo "--> 文件同步成功！"
else
echo "--> 文件同步不成功！"
exit 1
fi
}
upload_cdn() {
s_dir="/data/${PRO}/${TYPE}/${branch}/${VER}/${AGENT}"
#chown -R admin:admin "${s_dir}" 2>/dev/null
#chmod -R o-w "${c_dir}"
echo "---------------------------------------"
echo "--> 开始同步cdn文件 from : ${s_dir} >>> "
echo "---------------------------------------"
create_new_pw
if rsync -avhz --delete --exclude={*.svn,*.erl,.DS_Store}  --exclude="*.swp" --password-file="${RSY_NEW_PWD}" ${s_dir}/ rsy_user@${src_ip}::${PRO}_cdn/${PRO}/${branch}/${VER}/${AGENT}/ 
then
echo "--> 文件同步成功！"
else
echo "--> 文件同步不成功！"
exit 1
fi
}
############
# 上传类型
############
case $TYPE in
'server')
upload_server
;;
'client')
upload_client
;;
'cdn')
upload_cdn
;;
*)
echo "$TYPE 参数不正确！"
exit 1
;;
esac
