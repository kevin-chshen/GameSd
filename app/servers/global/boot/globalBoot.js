/**
 * @description global服务器启动入口
 * @author chshen
 * @date 2020/04/07
 */

const bearcat = require('bearcat');

const GlobalBoot = function () {
    this.$id = 'global_GlobalBoot';
};
module.exports = GlobalBoot;
bearcat.extend('global_GlobalBoot', 'logic_BaseBoot');

/**
 * 服务器启动
 */
GlobalBoot.prototype.startServer = function (app) {
    // 基础服务
    app.Service.registerService('Lock', 'global_LockService', null);
    app.Service.registerService('Config', 'logic_ConfigService', null);
    app.Service.registerService('Mongo', 'logic_MongoService', null);
    app.Service.registerService('Redis', 'logic_RedisService', null);
    app.Service.registerService('Online', 'logic_OnlineService', null);
    app.Service.registerService('Brief', 'logic_BriefService', null);
    app.Service.registerService('Helper', 'logic_HelperService', null);
    app.Service.registerService('Id', 'logic_IdService', null);
    app.Service.registerService('Event', 'logic_EventService', null);
    app.Service.registerService('Timer', 'logic_TimerService', ['Mongo', 'Notify', 'Event']);
    app.Service.registerService('Notify', 'global_NotifyService', null);
    app.Service.registerService('Activity', 'logic_ActivityService', ['Config', 'Event', 'Notify']);
    app.Service.registerService('Operate', 'logic_OperateService', ['Config', 'Event', 'Notify']);
    // 缓存服务
    app.Service.registerService('GuildMemberCache', 'logic_GuildMemberCacheService', null);
    app.Service.registerService('GuildCache', 'logic_GuildCacheService', 'GuildMemberCache');
    app.Service.registerService('ServerDataCache', 'logic_ServerDataCacheService', 'Mongo');
    // 其他服务
    app.Service.registerService('OfflineData', 'global_OfflineDataService', null);
    app.Service.registerService('Mail', 'global_MailService', null);
    app.Service.registerService('GlobalMail', 'global_GlobalMailService', 'Mongo');
    app.Service.registerService('Friend', 'global_FriendService', null);
    app.Service.registerService('Invest', 'global_InvestService', 'Mongo');
    app.Service.registerService('Log', 'global_LogService', null);
    app.Service.registerService('Guild', 'global_GuildService', 'GuildCache');
    app.Service.registerService('Counter', 'global_CounterService', 'ServerDataCache');
    app.Service.registerService('Drop', 'global_DropService', ['Config', 'Timer']);
    app.Service.registerService('Chat', 'global_ChatService', null);
    app.Service.registerService('Rank', 'global_RankService', ['Mongo', 'Redis', 'Guild']);
    app.Service.registerService('RankUpdate', 'logic_RankUpdateService', ['Mongo', 'Redis']);
    app.Service.registerService('FlowRate', 'global_FlowRateService', ['Mongo', 'Log']);
    app.Service.registerService('AutoShow', 'global_AutoShowService', 'Mongo');
    app.Service.registerService('OperateGlobal', 'global_OperateGlobalService', ['Config', 'Operate']);
    app.Service.registerService('GuildProject', 'global_GuildProjectService', ['Mongo', 'Activity', 'Log']);
    app.Service.registerService('Announcement', 'global_AnnouncementService', 'Mongo');

    // 设置global->战斗服路由
    app.route('battle', function(param, msg, app, cb){
        bearcat.getBean("ToBattleRoute").GetBattleRouter(param, msg, app, cb);
    });

    // 设置过滤器
    const globalBeforeFilter = require('../../../filter/globalBeforeFilter')(app);
    app.before(globalBeforeFilter);

    // 错误代码解析打印过滤器
    const globalAfterFilter = require('../../../filter/globalAfterFilter')(app);
    app.after(globalAfterFilter);
    
    // 过滤器 errorHandler
    app.set('errorHandler', require('../../../filter/errorHandler'));

};
