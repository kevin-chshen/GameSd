/**
 * @description 服务器数据缓存服务
 * @author linjs
 * @date 2020/04/29
 */

const bearcat = require('bearcat');

const ServerDataCacheService = function () {
    this.$id = 'logic_ServerDataCacheService';
    this.app = null;
};

module.exports = ServerDataCacheService;
bearcat.extend('logic_ServerDataCacheService', 'logic_MongoBaseService');
ServerDataCacheService.prototype.mongoDataClassFunc = require('@mongo/mongoServerData');
ServerDataCacheService.prototype.uidKey = 'uid';
ServerDataCacheService.prototype.needClean = false;  // 永久缓存,不需要清理

/**
 * 初始化全局邮件服务
 * 1.加载数据里的所有邮件
 */
ServerDataCacheService.prototype.init = async function () {
    // 只要加载本服的就可以了
    const mainServerId = this.app.SystemConfig.getServerId();
    await this.queryOrCreate(mainServerId);
};

