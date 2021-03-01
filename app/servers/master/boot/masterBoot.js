/**
 * @description master服务器启动入口
 * @author linjs
 * @date 2020/03/31
 */

const bearcat = require('bearcat');

const MasterBoot = function () {
    this.$id = 'master_MasterBoot';
};
module.exports = MasterBoot;
bearcat.extend('master_MasterBoot', 'logic_BaseBoot');

/**
 * 服务器启动
 */
MasterBoot.prototype.startServer = function (app) {
    if(!app.SystemConfig.isCross()){
        // 注册服务
        app.Service.registerService('Mongo', 'logic_MongoService', null);
        app.Service.registerService('Redis', 'logic_RedisService', null);
        app.Service.registerService('RedisClean', 'master_RedisCleanService', ['Mongo', 'Redis']);
        app.Service.registerService('RedisCache', 'master_RedisCacheService', 'RedisClean');
        app.Service.registerService('Repair', 'logic_RepairService', 'Mongo');
    }else{
        // 跨服服务器master
    }
};
