/**
 * @description global服运营日志服务
 * @author chshen
 * @date 2020/04/07
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

const LogService = function () {
    this.$id = 'global_LogService';
    this.app = null;
    this.onlineLogTimer = null;
};

module.exports = LogService;
bearcat.extend('global_LogService', 'logic_BaseService');

/**
 * @api override public
*/
LogService.prototype.init = async function () {
    // 定期存储全服数据
    this.onlineLogTimer = setInterval(() => {
        this.onlineLog();
    }, code.log.STATISTICS_ONLINE_LOG_TIME_MS);
};

LogService.prototype.afterStartUp = async function () {

};

/**
 * 在线日志
 * @api public
 */
LogService.prototype.onlineLog = function () {
    // redis 中拉取数据
    this.app.Redis.hgetall(code.redis.ONLINE_LOG_INFO.name).then(async ({ _err, res }) => {
        for (const platform in res) {
            let did, ips, people;
            const ipsRet = await this.app.Redis.hgetall([code.redis.LOG_ONLINE_IP.name, platform]);
            if (ipsRet.err || !ipsRet.res) {
                logger.error(`LogService onlineLog get ips error`);
                ips = {};
            } else {
                ips = ipsRet.res;
            }
            const didRet = await this.app.Redis.hgetall([code.redis.LOG_ONLINE_DID.name, platform]);
            if (didRet.err || !didRet.res) {
                logger.error(`LogService onlineLog get ips error`);
                did = {};
            } else {
                did = didRet.res;
            }
            const map = {};
            const devices = [];

            for (const [device, val] of Object.entries(ips)) {
                map[device] = map[device] || {};
                map[device].ips = Object.keys(JSON.parse(val)).length;

                devices.push(device);
            }
            for (const [device, val] of Object.entries(did)) {
                map[device] = map[device] || {};
                map[device].did = Object.keys(JSON.parse(val)).length;
            }
            for (const device of devices) {
                const { err, res } = await this.app.Redis.zrange([code.redis.LOG_ONLINE_PEOPLE.name, platform], 0, -1, device);
                if (err || !res) {
                    logger.error(`LogService onlineLog get people num error`);
                    people = 0;
                }
                else {
                    people = Number(res[1]);
                }
                map[device].people = people;
            }

            const curSecond = util.time.nowSecond();
            for (const [device, val] of Object.entries(map)) {
                const logOnline = {
                    platform: platform,
                    device: device,
                    people: val.people,
                    device_cnt: val.did,
                    ip_cnt: val.ips,
                    happend_time: curSecond,
                };
                this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_ONLINE, logOnline);
            }

        }
    });
};

/**
 * 帮派信息表
 * 说明：帮派信息表记录帮派详情，该表是状态表，是每个帮派一条数据的，当该帮派状态发生改变时需要对该表的相应数据进行及时更新。
 */
LogService.prototype.guildLog = async function (dbValue) {
    const logGuild = {};
    logGuild.platform = '';
    logGuild.device = '';
    logGuild.guild_id = dbValue.guildId;
    logGuild.guild_name = dbValue.name;
    logGuild.guild_level = dbValue.lv;
    logGuild.guild_exp = dbValue.exp;
    logGuild.guild_rank = 0;
    const rankInfo = await this.app.Rank.getSelfLeagueRank(logGuild.guild_id, code.rank.RANK_KEYS.EARN);
    if (rankInfo && rankInfo.rank) {
        logGuild.guild_rank = rankInfo.rank;
    }
    logGuild.guild_member = dbValue.memberList ? Object.keys(dbValue.memberList).length : 0;
    logGuild.guild_leader_id = dbValue.championsUid;
    logGuild.guild_leader_name = '';
    logGuild.guild_leader_power = 0;
    logGuild.guild_leader_vip = 0;
    const leaderBrief = await this.app.Brief.getBrief(logGuild.guild_leader_id);
    if (leaderBrief) {
        logGuild.guild_leader_name = leaderBrief.name;
        logGuild.guild_leader_power = leaderBrief.power;
        logGuild.guild_leader_vip = leaderBrief.vip;
    }
    logGuild.guild_notice = dbValue.notice;
    logGuild.guild_power = dbValue.totalPower;
    logGuild.guild_money = 0;
    logGuild.happend_time = util.time.nowSecond();
    this.app.rpcs.log.logRemote.updateLog({}, code.log.LOG_TYPE_GUILD, logGuild, { guild_id: logGuild.guild_id });
};


/**
 * 流量为王结算日志
 */
LogService.prototype.flowRateSettlementLog = async function (rankInfo) {
    const logInfo = { rankInfo: JSON.stringify(rankInfo), happend_time: util.time.nowSecond() };
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_FLOWRATE_SETTLEMENT, logInfo);
};

/**
 * 联盟盟主转让日志
 */
LogService.prototype.guildTransferLog = async function (transferType, guildId, guildName, oldUid, oldName, newUid, newName) {
    const logInfo = {};
    logInfo.transferType = transferType;
    logInfo.guildId = guildId;
    logInfo.guildName = guildName;
    logInfo.oldUid = oldUid;
    logInfo.oldName = oldName;
    logInfo.newUid = newUid;
    logInfo.newName = newName;
    logInfo.happend_time = util.time.nowSecond();
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_GUILD_TRANSFER, logInfo);
};

/**
 * 联盟全球项目日志
 */
LogService.prototype.guildProjectLog = async function(guildId, state, info){
    const logInfo = {};
    logInfo.guildId = guildId;
    logInfo.state = state;
    logInfo.info = JSON.stringify(info);
    logInfo.happend_time = util.time.nowSecond();
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_GUILD_PROJECT, logInfo);
};
/**
 * timer {time:触发时间, id:xxx, isStart:xxx, startMs:xxx, stopMs:xxx, noticeId: 公告ID}
 * @param isActivity false就是operate运营活动，true是activity正常活动
 */
LogService.prototype.activityLog = function (timer, isActivity = false) {
    let actionId = 0;
    let actionType = 9;
    let type = 0;
    if(isActivity){
        const cfg = this.app.Config.ActivityTime.get(timer.id);
        if(!cfg){
            return;
        }
        actionId = Number(cfg.Id);
        type = Number(cfg.ActivityId);
        actionType = 5100;
    }
    else{
        const cfg = this.app.Config.OperateBaseActivity.get(timer.id);
        if(!cfg){
            return;
        }
        actionId = Number(cfg.Id);
        type = Number(cfg.Type);
    }
    if (actionId > 0) {
        const logPve = {};
        logPve.platform = '';
        logPve.device = '';
        logPve.role_id = 0;
        logPve.account_name = '';
        logPve.dim_level = 0;
        logPve.action_type = actionType;
        logPve.action_id = actionId;
        logPve.pve_id = actionId;
        logPve.dim_power = 0;
        logPve.status = timer.isStart ? 1 : 2;
        logPve.info = String(type);
        logPve.begin_time = util.time.ms2s(timer.startMs);
        logPve.end_time = util.time.ms2s(timer.stopMs);
        logPve.time_duration = logPve.end_time - logPve.begin_time;
        logPve.happend_time = util.time.nowSecond();
        this.pveLog(logPve);
    }
};
/**
 * PVE日志
 */
LogService.prototype.pveLog = function (logPve) {
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_PVE, logPve);
};

/**
 * @api override public
*/
LogService.prototype.shutdown = function () {
    // 清除定时器
    clearInterval(this.onlineLogTimer);
};
