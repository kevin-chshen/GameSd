/**
 * @description gate服务器启动入口
 * @author linjs
 * @date 2020/03/31
 */

const bearcat = require('bearcat');
const pomelo = require('pomelo');

const GateBoot = function () {
    this.$id = 'gate_GateBoot';
};
module.exports = GateBoot;
bearcat.extend('gate_GateBoot', 'logic_BaseBoot');

/**
 * 服务器启动
 */
GateBoot.prototype.startServer = function (app) {
    app.set('connectorConfig', {
        connector: pomelo.connectors.hybridconnector,
        heartbeat: app.SystemConfig.heartbeat,
        timeout: app.SystemConfig.timeout,
        useDict: true,
        useProtobuf: true,
        setNoDelay : true,
    });

    // 注册服务
    app.Service.registerService('Config', 'logic_ConfigService', null);
    app.Service.registerService('Mongo', 'logic_MongoService', null);
    app.Service.registerService('Redis', 'logic_RedisService', null);
    app.Service.registerService('RedisMyLogin', 'logic_RedisMyLoginService', null);
    app.Service.registerService('RedisCache', 'gate_RedisCacheService', 'Redis');
    app.Service.registerService('ConnectorDistributor', 'gate_ConnectorDistributorService', null);
};
