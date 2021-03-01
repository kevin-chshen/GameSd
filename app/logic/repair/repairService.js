/**
 * @description 修复数据
 * @author chshen
 * @date 2020/07/18
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const MongoVersion = require('@mongo/mongoVersion');
const bearcat = require('bearcat');
const code = require('@code');
const path = require('path');
const fs = require('fs');

const RepairService = function() {
    this.$id = 'logic_RepairService';
    this.app = null;
};
module.exports = RepairService;
bearcat.extend('logic_RepairService', 'logic_BaseService');

RepairService.prototype.init = async function() {
    const versions = await MongoVersion.query({});
    const versionRet = code.system.VERSION;
    let mongo;
    if (versions.length == 0) {
        mongo = new MongoVersion({
            ver: versionRet
        });
        mongo.update({ ver: versionRet });
    } else {
        mongo = versions[0];
    }
    const ver = mongo.get('ver');
    logger.warn(`repair oldVer:`, ver, 'newVer:', versionRet);
    if (ver >= versionRet) {
        return;
    }
    // 获取所有sql文件 X.X.X.sql
    const sqlDirPath = path.resolve(__dirname, '../repair/repairVersion');
    const fileList = fs.readdirSync(sqlDirPath, 'utf-8');
    const versionList = fileList.map((fileName) => {
        return fileName.split('.js').join('');
    });
    const ableVersions = versionList.filter((v) => {
        return v <= versionRet;
    });
    const len = ableVersions.length;
    if (len > 0) {
        ableVersions.sort((a, b) =>{
            return a - b;
        });
        for (let i = 0; i < len; i++) {
            const version = ableVersions[i];
            const dir = path.resolve(__dirname, `../repair/repairVersion/${version}.js`);
            const repair = require(dir);
            await (new repair()).update(this.app);
            mongo.update({ ver: version });
        }
    } else {
        logger.warn(`repair service version: ${versionRet}, ableVersions:%j`,ableVersions);
        mongo.update({ ver: versionRet });
    }
};
