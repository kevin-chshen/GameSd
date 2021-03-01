/**
 * @description ip定位
 * @author jzy
 * @date 2020/07/22
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const os = require('os');
const bearcat = require('bearcat')
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const ipdb = require('ipdb');

const IpLocationService = function() {
    this.$id = 'auth_IpLocationService';
    this.app = null;

    this.ipDbCity = null;
};
module.exports = IpLocationService;
bearcat.extend('auth_IpLocationService', 'logic_BaseService');

const IP_DB_FILENAME = "ip.ipdb";

/**
 * 比对版本，版本不对就下载
 */
IpLocationService.prototype.checkVersion = async function(){
    const versionPath = path.join(this.app.SystemConfig.getIpDbDir(), "versionSha1");
    let saveData = "";
    if(fs.existsSync(versionPath)){
        saveData = fs.readFileSync(versionPath, {encoding: 'utf8'});
    }
    await axios.request({
        url: 'https://120.31.139.213/ipip/version.txt',
        method: 'get',
        headers: {
            'Host': 'p.gz4399.com'
        }
    }).then((rep)=>{
        let nowSha1 = "";
        for(const str of rep.data.split("\n")){
            const list = str.split("="); 
            if(list.length>=2 && list[0].trim()=="sha1"){
                nowSha1 = list[1].trim();
                break;
            }
        }
        if(nowSha1!=saveData){
            fs.writeFileSync(versionPath, nowSha1, {encoding: 'utf8'});
            this.downloadDB().then(()=>{
                logger.info("download ip database ok");
            });
        }
    });
};

/**
 * 下载数据库文件
 */
IpLocationService.prototype.downloadDB = async function(){
    const dbPath = path.join(this.app.SystemConfig.getIpDbDir(), IP_DB_FILENAME);
    const writer = fs.createWriteStream(dbPath);
    const response = await axios.request({
        url: 'https://120.31.139.213/ipip/ip.ipdb',
        method: 'get',
        headers: {
            'Host': 'p.gz4399.com'
        },
        responseType: "stream",
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
};


/**
 * 查询ip对应的城市地址
 * @param {String} ipAddr 
 */
IpLocationService.prototype.getCity = function(ipAddr){
    if(!this.ipDbCity){
        const dbPath = path.join(this.app.SystemConfig.getIpDbDir(), IP_DB_FILENAME);
        if(fs.existsSync(dbPath)){
            this.ipDbCity = new ipdb.City(dbPath);
        }
    }
    
    if(this.ipDbCity){
        const info = this.ipDbCity.findInfo(ipAddr, "CN");
        return info.cityName;
    }else{
        logger.warn("未找到ip数据库文件");
        return "";
    }
}
