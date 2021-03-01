/**
 * @description game服务器启动入口
 * @author linjs
 * @date 2020/03/31
 */

const bearcat = require('bearcat');
const pomelo = require('pomelo');

const GameBoot = function () {
    this.$id = 'game_GameBoot';
};
module.exports = GameBoot;
bearcat.extend('game_GameBoot', 'logic_BaseBoot');

/**
 * 服务器启动
 */
GameBoot.prototype.startServer = function (app) {
    app.set('connectorConfig', {
        connector: pomelo.connectors.hybridconnector,
        setNoDelay : true,
    });

    // 基础服务
    app.Service.registerService('Config', 'logic_ConfigService', null);
    app.Service.registerService('Helper', 'logic_HelperService', null);
    app.Service.registerService('Mongo', 'logic_MongoService', null);
    app.Service.registerService('Redis', 'logic_RedisService', null);
    app.Service.registerService('RedisMyLogin', 'logic_RedisMyLoginService', null);
    app.Service.registerService('Brief', 'logic_BriefService', null);
    app.Service.registerService('Id', 'logic_IdService', null);
    app.Service.registerService('Event', 'logic_EventService', null);
    app.Service.registerService('Timer', 'logic_TimerService', ['Mongo', 'Notify', 'Event']);
    app.Service.registerService('Notify', 'game_NotifyService', null);
    app.Service.registerService('Activity', 'logic_ActivityService', ['Config', 'Event', 'Notify']);
    app.Service.registerService('Operate', 'logic_OperateService', ['Config', 'Event', 'Notify']);
    app.Service.registerService('CrossClient', 'logic_CrossClientService', null);
    // 本地服务
    app.Service.registerService('RedisCache', 'game_RedisCacheService', 'Redis');
    app.Service.registerService('Log', 'game_LogService', null);
    app.Service.registerService('Player', 'game_PlayerService', ['Timer','Event', 'Config']);
    app.Service.registerService('Item', 'game_ItemService', null);
    app.Service.registerService('Mail', 'game_MailService', null);
    app.Service.registerService('LivePfs', 'game_LivePlatformService', null);
    app.Service.registerService('Chat', 'game_ChatService', null);
    app.Service.registerService('Gm', 'game_GmService', null);
    app.Service.registerService('Settings', 'game_SettingsService', null);
    app.Service.registerService('RankUpdate', 'logic_RankUpdateService', ['Mongo','Redis']);
    app.Service.registerService('OperateRegister', 'game_OperateRegisterService', ['Config', 'Operate']);
    app.Service.registerService('ActivityRegister', 'game_ActivityRegisterService', ['Config', 'Activity']);
    
    // 路由设置
    app.route('battle', function(param, msg, app, cb){
        bearcat.getBean("ToBattleRoute").GetBattleRouter(param, msg, app, cb);
    });

    // 设置过滤器
    const attachPlayerFilter = require('../../../filter/attachPlayerFilter')(app);
    app.before(attachPlayerFilter);

    // 错误代码解析打印过滤器
    const codeErrFilter = require('../../../filter/errCodeFilter')(app);
    app.after(codeErrFilter);
};
