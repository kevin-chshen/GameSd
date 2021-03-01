/**
 * @description battle服务器启动入口
 * @author linjs
 * @date 2020/03/30
 */

const bearcat = require('bearcat');
const pomelo = require('pomelo');

const BattleBoot = function () {
    this.$id = 'battle_BattleBoot';
};
module.exports = BattleBoot;
bearcat.extend('battle_BattleBoot', 'logic_BaseBoot');

/**
 * 服务器启动
 */
BattleBoot.prototype.startServer = function (app) {
    app.set('connectorConfig', {
        connector: pomelo.connectors.hybridconnector
    });

    // 注册服务
    app.Service.registerService('Config', 'logic_ConfigService', null);
    app.Service.registerService('Mongo', 'logic_MongoService', null);
    app.Service.registerService('Redis', 'logic_RedisService', null);
    app.Service.registerService('Battle', 'battle_BattleService', null);
    app.Service.registerService('BattleData', 'battle_BattleDataService', null);
};
