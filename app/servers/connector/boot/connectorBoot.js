/**
 * @description connector服务器启动入口
 * @author linjs
 * @date 2020/03/31
 */

const bearcat = require('bearcat');
const pomelo = require('pomelo');

const ConnectorBoot = function () {
    this.$id = 'connector_ConnectorBoot';
};
module.exports = ConnectorBoot;
bearcat.extend('connector_ConnectorBoot', 'logic_BaseBoot');

/**
 * 服务器启动
 */
ConnectorBoot.prototype.startServer = function (app) {
    // 连接设置
    app.set('connectorConfig', {
        connector: pomelo.connectors.hybridconnector,
        heartbeat: app.SystemConfig.heartbeat,
        timeout: app.SystemConfig.timeout,
        useDict: true,
        useProtobuf: true,
        setNoDelay : true,
    });

    // 发送消息设置
    app.set('pushSchedulerConfig', {
        scheduler: [
            {
                id: 'direct',
                scheduler: pomelo.pushSchedulers.direct
            },
            {
                id: 'buffer',
                scheduler: pomelo.pushSchedulers.buffer,
                options: { flushInterval: 300 }
            }
        ],
        selector: function (reqId, route, msg, recv, opts, cb) {
            if (opts.type === 'broadcast') {
                // 广播消息使用缓存方式,1秒刷新间隔
                cb('buffer');
            } else {
                // 其他消息使用直接发送方式
                cb('direct');
            }
        }
    });

    // session设置
    app.set('sessionConfig', {
        singleSession: true
    });

    // 路由设置
    app.route('game', bearcat.getBean("ConnectorRoute").getRoute());
    app.route('battle', function(param, msg, app, cb){
        bearcat.getBean("ToBattleRoute").GetBattleQueryRouter(param, msg, app, cb);
    });


    // 注册服务
    app.Service.registerService('Mongo', 'logic_MongoService', null);
    app.Service.registerService('Redis', 'logic_RedisService', null);
    app.Service.registerService('RedisCache', 'connector_RedisCacheService', 'Redis');
};
