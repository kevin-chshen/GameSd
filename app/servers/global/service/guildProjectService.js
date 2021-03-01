/* eslint-disable indent */
/**
 * @description 联盟全球项目数据服务
 * @author chenyq
 * @date 2020/05/27
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

const GuildProjectService = function () {
    this.$id = 'global_GuildProjectService';
    this.app = null;
    this.timer = {};
    this.lockDonation = null;
    this.lockNegotiate = null;
    this.lockAccredit = null;
};

module.exports = GuildProjectService;
bearcat.extend('global_GuildProjectService', 'logic_MongoBaseService');
GuildProjectService.prototype.mongoDataClassFunc = require('@mongo/mongoGuildProject');
GuildProjectService.prototype.uidKey = 'guildId';
GuildProjectService.prototype.needClean = false;  // 永久缓存,不需要清理


GuildProjectService.prototype.init = async function () {
    // const noon = code.guildProject.PROJECT_ACT_ID.NOON;
    // const night = code.guildProject.PROJECT_ACT_ID.NIGHT;
    // this.app.Event.on([code.eventServer.ACTIVITY_START_TIMER.name, noon], 0, async (...param) => {
    //     await this.onProjectStartEvent(...param);
        
    //     this.app.Log.activityLog(param[0], true);
    // });
    // this.app.Event.on([code.eventServer.ACTIVITY_STOP_TIMER.name, noon], 0, async (...param) => {
    //     await this.onProjectStopEvent(...param);
    // });
    // this.app.Event.on([code.eventServer.ACTIVITY_START_TIMER.name, night], 0, async (...param) => {
    //     await this.onProjectStartEvent(...param);
        
    //     this.app.Log.activityLog(param[0], true);
    // });
    // this.app.Event.on([code.eventServer.ACTIVITY_STOP_TIMER.name, night], 0, async (...param) => {
    //     await this.onProjectStopEvent(...param);
    // });
    // this.app.Event.on(code.eventServer.GUILD_PROJECT_JOIN.name, 0, async (...param) => {
    //     await this.onProjectJoinGuild(...param);
    // });
    // this.app.Event.on(code.eventServer.GUILD_PROJECT_SETTLEMENT.name, 0, async (...param) => {
    //     await this.onProjectSettlement(...param);
    // });

    logger.info("global_GuildProjectService init");
};

GuildProjectService.prototype.afterStartAll = async function () {
    const noon = code.guildProject.PROJECT_ACT_ID.NOON;
    const night = code.guildProject.PROJECT_ACT_ID.NIGHT;
    this.app.Event.on([code.eventServer.ACTIVITY_START_TIMER.name, noon], 0, async (...param) => {
        await this.onProjectStartEvent(...param);
    });
    this.app.Event.on([code.eventServer.ACTIVITY_STOP_TIMER.name, noon], 0, async (...param) => {
        await this.onProjectStopEvent(...param);
    });
    this.app.Event.on([code.eventServer.ACTIVITY_START_TIMER.name, night], 0, async (...param) => {
        await this.onProjectStartEvent(...param);
    });
    this.app.Event.on([code.eventServer.ACTIVITY_STOP_TIMER.name, night], 0, async (...param) => {
        await this.onProjectStopEvent(...param);
    });
    this.app.Event.on(code.eventServer.GUILD_PROJECT_JOIN.name, 0, async (...param) => {
        await this.onProjectJoinGuild(...param);
    });
    this.app.Event.on(code.eventServer.GUILD_PROJECT_SETTLEMENT.name, 0, async (...param) => {
        await this.onProjectSettlement(...param);
    });
    const timerInfo = {};
    timerInfo[noon] = this.app.Activity.initTimer(noon);
    timerInfo[night] = this.app.Activity.initTimer(night);

    await this.loadAll();

    // 处理已超过活动时间，但未结算的项目
    await this.loadProjectEndProcess(timerInfo);

    logger.info("global_GuildProjectService afterStartAll");
};

//-------------------------------------------------------------------------------------
// Event
//-------------------------------------------------------------------------------------
/**
 * param [{time:触发时间, id:xxx, isStart:xxx, startMs:xxx, stopMs:xxx, noticeId: 公告ID}]
 */
GuildProjectService.prototype.onProjectStartEvent = async function (...param) {
    const timer = param[0];
    this.timer[timer.id] = timer;
    // 广播活动开始 广播所有公会有在线的玩家
    await this.projectAllGuildNotify({ state: code.guildProject.PROJECT_STATE.QUERY });
    this.app.Log.activityLog(timer, true);
    logger.info("全球项目：活动开始~~~", ' timer:', timer);
};
GuildProjectService.prototype.onProjectStopEvent = async function (...param) {
    const timer = param[0];
    delete this.timer[timer.id];
    // 广播活动结束
    await this.projectAllGuildNotify({ state: code.guildProject.PROJECT_STATE.NONE });
    // 结算处理
    const allProject = this.getAllData();
    for (const projectData of allProject) {
        await this.closeProject(projectData);
    }
    this.app.Log.activityLog(timer, true);
    logger.info("全球项目：活动结束~~~", ' timer:', timer);
};
/**
 * 加入联盟触发处理 推送当前活动阶段
 */
GuildProjectService.prototype.onProjectJoinGuild = async function (uid) {
    const info = await this.guildProjectGetInfo(uid);
    if (info.code != code.err.SUCCEEDED) {
        return;
    }
    const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    if (!retRole.err && retRole.res) {
        this.app.rpcs.game.recoveryRemote.recoveryInfoNotify.toServer(retRole.res, uid, code.recovery.RECOVERY_TYPE.PROJECT_NEGOTIATE);
    }
    await this.projectInfoNotify(0, { state: info.state, arrangementInfo: info.arrangementInfo, negotiateInfo: info.negotiateInfo, operationInfo: info.operationInfo }, [uid]);
};
/**
 * 离开联盟触发结算
 */
GuildProjectService.prototype.onProjectSettlement = async function (uid, guildId) {
    const state = await this.getState(guildId);
    if (state != code.guildProject.PROJECT_STATE.OPERATION) {
        return;
    }
    const projectData = await this.queryOrCreate(guildId);
    if (!projectData) {
        return;
    }
    const posInfo = projectData.get('posInfo');
    if (!posInfo[uid]) {
        return;
    }
    const posData = { ...posInfo[uid] };
    delete posInfo[uid];
    projectData.update({ posInfo: posInfo });
    // 下发对方运营奖励结算
    this.sendSettlementMail(uid, posData, projectData.dbValue());

    this.projectNotifyOperation(guildId, projectData.dbValue());
};

//-------------------------------------------------------------------------------------
// public
//-------------------------------------------------------------------------------------
/**
 * 获取项目信息
 */
GuildProjectService.prototype.guildProjectGetInfo = async function (uid) {
    // 获取玩家公会信息
    // 判断是否在公会
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    const guildId = memberInfo.guildId;
    // 未加入联盟 8037
    const isJoin = await this.app.Guild.guildIdExists(guildId);
    if (!isJoin) {
        // 8201 未加入联盟，无法参与
        return { code: code.err.ERR_LEAGUE_PROJECT_NO_JOIN };
    }
    const info = {};
    info.code = code.err.SUCCEEDED;
    info.state = await this.getState(guildId);
    info.recoveryInfo = {};
    const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    if (!retRole.err && retRole.res) {
        const { err, res } = await this.app.rpcs.game.recoveryRemote.getRecoveryInfo.toServer(retRole.res, uid, code.recovery.RECOVERY_TYPE.PROJECT_NEGOTIATE);
        if (!err) {
            info.recoveryInfo = res;
        }
    }
    // logger.info(`全球项目状态：${info.state}`);
    const projectData = await this.queryOrCreate(guildId);
    if (!projectData) {
        return info;
    }
    info.num = 0;
    info.rate = 0;
    info.buyNum = 0;
    const dbValue = projectData.dbValue();
    switch (info.state) {
        case code.guildProject.PROJECT_STATE.NONE:
        case code.guildProject.PROJECT_STATE.QUERY:
            break;
        case code.guildProject.PROJECT_STATE.ARRANGEMENT:
            info.arrangementInfo = this.returnArrangementInfo(dbValue);
            if (dbValue.donationInfo && dbValue.donationInfo[uid]) {
                info.rate = dbValue.donationInfo[uid].donation || 0;
                info.num = dbValue.donationInfo[uid].cashNum || 0;
            }
            break;
        case code.guildProject.PROJECT_STATE.NEGOTIATE:
            info.negotiateInfo = this.returnNegotiateInfo(dbValue);
            if (dbValue.damageInfo && dbValue.damageInfo[uid]) {
                info.buyNum = dbValue.damageInfo[uid].buyNum || 0;
            }
            break;
        case code.guildProject.PROJECT_STATE.OPERATION:
            info.operationInfo = await this.returnOperationInfo(dbValue);
            break;
    }
    return info;
};
/**
 * 项目开启
 * @param {Number} uid
 * @param {Number} id
 * @param {Number} type 项目类型 1,2,3
 */
GuildProjectService.prototype.guildProjectOpen = async function (uid, id, type) {
    const config = this.app.Config.LeagueProject.get(id);
    if (!config || !config.RewardType || !config.RewardType[type - 1]) {
        // 8202 开启项目不存在
        return { code: code.err.ERR_LEAGUE_PROJECT_ID_ERROR };
    }
    // 判断是否在公会
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    const guildId = memberInfo.guildId;
    // 未加入联盟 8037
    const isJoin = await this.app.Guild.guildIdExists(guildId);
    if (!isJoin) {
        // 8201 未加入联盟，无法参与
        return { code: code.err.ERR_LEAGUE_PROJECT_NO_JOIN };
    }
    // 权限判断
    if (!this.app.Config.League.jobOperate(code.guild.GUILD_JOB_OPERATE.PROJECT_OPEN, memberInfo.job)) {
        // 8203 非盟主、副盟主，无法开启
        return { code: code.err.ERR_LEAGUE_PROJECT_JOB_LIMIT };
    }
    const lv = await this.app.Guild.getGuildLv(memberInfo.guildId);
    if (lv < config.LeagueLv) {
        // 8204 联盟等级不足，无法开启
        return { code: code.err.ERR_LEAGUE_PROJECT_LV_LIMIT };
    }
    const state = await this.getState(guildId);
    if (state != code.guildProject.PROJECT_STATE.QUERY) {
        // 8205 不在活动时间内或项目已开启
        return { code: code.err.ERR_LEAGUE_PROJECT_TIME_ERROR };
    }
    await this.openProject(guildId, id, type);
    return { code: code.err.SUCCEEDED };
};

/**
 * 项目捐献
 * @param {Number} uid
 * @param {Number} type 捐献类型 0现金 1钻石
 */
GuildProjectService.prototype.guildProjectDonation = async function (uid, type) {
    while (this.lockDonation) {
        await this.lockDonation;
    }
    this.lockDonation = this.guildProjectDonationProcess(uid, type).catch(
        err => {
            logger.error("guildProjectDonation error:", uid, type, err);
        }
    );
    const data = await this.lockDonation;
    this.lockDonation = null;
    return data;
}
/**
 * 项目捐献
 * @param {Number} uid
 * @param {Number} type 捐献类型 0现金 1钻石
 */
GuildProjectService.prototype.guildProjectDonationProcess = async function (uid, type) {
    // 判断是否在公会
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    const guildId = memberInfo.guildId;
    // 未加入联盟 8037
    const isJoin = await this.app.Guild.guildIdExists(guildId);
    if (!isJoin) {
        // 8201 未加入联盟，无法参与
        return { code: code.err.ERR_LEAGUE_PROJECT_NO_JOIN };
    }
    const state = await this.getState(guildId);
    if (state != code.guildProject.PROJECT_STATE.ARRANGEMENT) {
        // 8206 不在活动时间内或捐献已满
        return { code: code.err.ERR_LEAGUE_PROJECT_DONATION_TIME_ERROR };
    }
    const nowTime = Date.now();

    const projectData = await this.queryOrCreate(guildId);
    const dbValue = projectData.dbValue();
    const config = this.app.Config.LeagueProject.getDonationConfig(dbValue.id, type);
    if (!config) {
        // 8207 开启项目不存在
        return { code: code.err.ERR_LEAGUE_PROJECT_DONATION_ID_ERROR };
    }
    if (!dbValue.donationInfo[uid]) {
        dbValue.donationInfo[uid] = { donation: 0, cashNum: 0, time: 0 };
    }
    // 获取玩家所在再game服
    const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    if (retRole.err || !retRole.res) {
        return { code: code.err.FAILED };
    }
    if (type == code.guildProject.PROJECT_DONATION_TYPE.CASH) {
        // 现金捐献次数
        const newNum = dbValue.donationInfo[uid].cashNum + 1;
        if (config.limit != 0 && newNum > config.limit) {
            // 8209 现金捐献次数不足
            return { code: code.err.ERR_LEAGUE_PROJECT_DONATION_CASH_LIMIT };
        }
        // 现金消耗
        const brief = await this.app.Brief.getBrief(uid) || {};
        const fameConfig = this.app.Config.Prestige.get(brief.lv || 1);
        const costList = util.proto.encodeConfigAward([fameConfig.LeagueProjectCost]);
        const result = await this.app.rpcs.game.itemRemote.deleteItem.toServer(retRole.res, uid, costList, code.reason.OP_GUILD_PROJECT_DONATION_MONEY_COST);
        if (!result.res) {
            // 8210 现金消耗不足
            return { code: code.err.ERR_LEAGUE_PROJECT_DONATION_CASH_COST };
        }
        else {
            dbValue.donationInfo[uid].cashNum = newNum;
        }
    }
    else if (type == code.guildProject.PROJECT_DONATION_TYPE.DIAMOND) {
        // 钻石消耗
        const costList = util.proto.encodeConfigAward([config.cost]);
        const result = await this.app.rpcs.game.itemRemote.deleteItem.toServer(retRole.res, uid, costList, code.reason.OP_GUILD_PROJECT_DONATION_DIAMOND_COST);
        if (!result.res) {
            // 8211 钻石消耗不足
            return { code: code.err.ERR_LEAGUE_PROJECT_DONATION_DIAMOND_COST };
        }
    }
    else {
        // 8208 捐献类型错误
        return { code: code.err.ERR_LEAGUE_PROJECT_DONATION_TYPE_ERROR };
    }

    const newDBValue = await this.processDonation(uid, guildId, config, dbValue, retRole);

    let num = 0;
    let rate = 0;
    if (newDBValue.donationInfo[uid]) {
        rate = newDBValue.donationInfo[uid].donation || 0;
        num = newDBValue.donationInfo[uid].cashNum || 0;
    }
    return { code: code.err.SUCCEEDED, num: num, rate: rate, donationType: type };
};
/**
 * 处理捐献进度
 */
GuildProjectService.prototype.processDonation = async function (uid, guildId, config, dbValue, retRole) {
    const newProjectData = await this.queryOrCreate(guildId);
    const newDBValue = newProjectData.dbValue();
    if (newDBValue.donation < code.guildProject.PROJECT_DONATION_FULL) {
        let addVal = config.add;
        if (newDBValue.donation + config.add > code.guildProject.PROJECT_DONATION_FULL) {
            addVal = code.guildProject.PROJECT_DONATION_FULL - newDBValue.donation;
        }

        newDBValue.donation += addVal;
        newDBValue.donationInfo[uid].donation += addVal;
        newDBValue.donationInfo[uid].time = Date.now();
        newDBValue.donationInfo[uid].cashNum = dbValue.donationInfo[uid].cashNum;

        const data = {};
        data.donation = newDBValue.donation;
        data.donationInfo = newDBValue.donationInfo;
        newProjectData.update(data);

        // 捐献奖励
        const rewardList = util.proto.encodeConfigAward([config.reward]);
        this.app.rpcs.game.itemRemote.addItem.toServer(retRole.res, uid, rewardList, code.reason.OP_GUILD_PROJECT_DONATION_GET);
        // 检测捐献进度
        if (newDBValue.donation < code.guildProject.PROJECT_DONATION_FULL) {
            // 广播筹备信息
            const arrangementInfo = this.returnArrangementInfo(newDBValue);
            this.projectInfoNotify(newDBValue.guildId, { state: code.guildProject.PROJECT_STATE.ARRANGEMENT, arrangementInfo: arrangementInfo });
        }
        else {
            // 满进度 抽取幸运儿 发送邮件
            const donationObj = {};
            for (const [uid, info] of Object.entries(newDBValue.donationInfo)) {
                donationObj[uid] = info.donation;
            }
            const lucky = util.random.randomWeightObject(donationObj);
            if (lucky) {
                this.sendProjectMail([lucky], code.mail.MAIL_CONFIG_ID.GUILD_PROJECT_LUCKY, config.luckyReward);
            }
            this.resetChallengeRecovery(newDBValue.guildId);
            // 广播谈判信息
            const negotiateInfo = this.returnNegotiateInfo(newDBValue);
            this.projectInfoNotify(newDBValue.guildId, { state: code.guildProject.PROJECT_STATE.NEGOTIATE, negotiateInfo: negotiateInfo });

            this.app.Log.guildProjectLog(guildId, code.guildProject.PROJECT_STATE.ARRANGEMENT, newDBValue);
        }
    }
    return newDBValue;
};

/**
 * 获取捐献排行
 */
GuildProjectService.prototype.guildProjectDonationRanking = async function (uid) {
    // 判断是否在公会
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    const guildId = memberInfo.guildId;
    // 未加入联盟 8037
    const isJoin = await this.app.Guild.guildIdExists(guildId);
    if (!isJoin) {
        // 8201 未加入联盟，无法参与
        return { code: code.err.ERR_LEAGUE_PROJECT_NO_JOIN };
    }
    const projectData = await this.queryOrCreate(guildId);
    const donationInfo = projectData.get('donationInfo');
    const donationRankList = [];
    for (const [uid, info] of Object.entries(donationInfo)) {
        const rankInfo = {};
        rankInfo.uid = uid;
        rankInfo.donation = info.donation;
        rankInfo.time = util.time.ms2s(info.time);
        rankInfo.roleInfo = await this.getRoleInfo(uid);
        donationRankList.push(rankInfo);
    }

    return { code: code.err.SUCCEEDED, donationRankList: donationRankList };
};

/**
 * 谈判
 */
GuildProjectService.prototype.guildProjectNegotiate = async function (session) {
    while (this.lockNegotiate) {
        await this.lockNegotiate;
    }
    this.lockNegotiate = this.guildProjectNegotiateProcess(session).catch(
        err => {
            logger.error("guildProjectNegotiate error:", session.uid, err);
        }
    );
    const data = await this.lockNegotiate;
    this.lockNegotiate = null;
    return data;
}
/**
 * 谈判
 */
GuildProjectService.prototype.guildProjectNegotiateProcess = async function (session) {
    const uid = session.uid;
    // 判断是否在公会
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    const guildId = memberInfo.guildId;
    // 未加入联盟 8037
    const isJoin = await this.app.Guild.guildIdExists(guildId);
    if (!isJoin) {
        // 8201 未加入联盟，无法参与
        return { code: code.err.ERR_LEAGUE_PROJECT_NO_JOIN };
    }
    const state = await this.getState(guildId);
    if (state != code.guildProject.PROJECT_STATE.NEGOTIATE) {
        // 8212 不在活动时间内或谈判已结束
        return { code: code.err.ERR_LEAGUE_PROJECT_NEGOTIATE_TIME_ERROR };
    }
    // 玩家战斗信息
    const brief = await this.app.Brief.getBrief(uid);
    if (!brief) {
        return { code: code.err.ERR_FLOW_RATE_CHALLENGE_BRIEF_ERROR };// 8105
    }
    // 获取玩家所在再game服
    const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    if (retRole.err || !retRole.res) {
        return { code: code.err.FAILED };
    }
    const selfName = brief.name;
    const selfArray = this.getCardBattleInfo(brief.battleMember);
    if (selfArray.length <= 0) {
        // 8106 无上阵主播，无法谈判
        return { code: code.err.ERR_LEAGUE_PROJECT_NEGOTIATE_FORMATION_ERROR };
    }
    return await this.guildProjectChallenge(uid, guildId, retRole, selfName, session, selfArray);
};

GuildProjectService.prototype.guildProjectChallenge = async function (uid, guildId, retRole, selfName, session, selfArray) {
    const projectData = await this.queryOrCreate(guildId);
    const dbValue = projectData.dbValue();
    const config = this.app.Config.LeagueProject.get(dbValue.id);
    if (!config) {
        // 8213 开启项目不存在
        return { code: code.err.ERR_LEAGUE_PROJECT_NEGOTIATE_ID_ERROR };
    }
    if (dbValue.curHp <= 0) {
        // 8214 谈判已结束
        return { code: code.err.ERR_LEAGUE_PROJECT_NEGOTIATE_END_ERROR };
    }
    // 消耗
    const result = await this.app.rpcs.game.recoveryRemote.deductRecovery.toServer(retRole.res, uid, code.recovery.RECOVERY_TYPE.PROJECT_NEGOTIATE, 1);
    if (!result.res) {
        // 8104 谈判次数不足
        return { code: code.err.ERR_LEAGUE_PROJECT_NEGOTIATE_LIMIT_ERROR };
    }
    const playerInfo = { uid: uid, name: selfName };
    // boss信息
    const bossInfo = this.app.Config.LeagueProject.getBossInfo(dbValue.id, dbValue.curHp);
    let battleRes = {};
    let attackReward = [];
    // 战斗
    await this.app.rpcs.battle.battleRemote.startCustomizedBattle(
        session,
        code.battle.BATTLE_TYPE.GUILD_PROJECT,
        playerInfo,
        selfArray,
        bossInfo.enemyInfo,
        bossInfo.enemyArray,
        [],
        [],
        bossInfo.baseEnemyArray,
    ).then(async ({ err, res }) => {
        if (err) {
            logger.info("guildProject startBattle err or false");
            return { code: code.err.SUCCEEDED };
        }
        battleRes = res;
        if (util.object.isNull(battleRes)) {
            logger.info("guildProject startBattle battleRes = {}");
            return { code: code.err.SUCCEEDED };
        }
        const isWin = battleRes.isWin;
        let bossHp = 0;
        // boss死亡 enemyArray为[]
        if (battleRes && battleRes.enemyArray && battleRes.enemyArray.length > 0) {
            bossHp = battleRes.enemyArray[0].hp;
        }
        logger.info("战斗结果:", uid, dbValue.curHp, bossHp, battleRes);
        // 计算造成的伤害
        const damage = dbValue.curHp - bossHp;
        dbValue.curHp = bossHp;
        const damageInfo = dbValue.damageInfo;
        if (!damageInfo[uid]) {
            damageInfo[uid] = { damage: 0, time: 0 };
        }
        const nowTime = Date.now();
        damageInfo[uid].damage += damage;
        damageInfo[uid].time = nowTime;
        const data = {};
        data.atkLastTime = nowTime;
        data.curHp = dbValue.curHp;
        data.damageInfo = dbValue.damageInfo;
        projectData.update(data);
        // 每次攻击奖励
        const rate = damage / config.BossHp;
        const totalAttackReward = util.proto.encodeConfigAward(config.AttackReward);
        attackReward = util.item.multi(totalAttackReward, rate);

        let awardList = {};
        if (attackReward.length > 0) {
            for (const r of attackReward) {
                if(r.itemID == code.guild.GUILD_ITEM_ID.CONTRIBUTE && Number(r.itemNum) <= 0){
                    r.itemNum = 1;
                }
            }
            this.app.rpcs.game.itemRemote.addItem.toServer(retRole.res, uid, attackReward, code.reason.OP_GUILD_PROJECT_NEGOTIATE_GET);
            awardList = util.proto.encodeAward(attackReward);
            await this.projectNegotiateRewardNotify(uid, { awardList: awardList });
        }
        // console.log('每次攻击信息：', uid, '伤害：', damage, '奖励：', attackReward, rate);
        // boss是否死亡
        if (!isWin) {
            // 广播谈判信息
            const negotiateInfo = this.returnNegotiateInfo(dbValue);
            await this.projectInfoNotify(guildId, { state: code.guildProject.PROJECT_STATE.NEGOTIATE, negotiateInfo: negotiateInfo });
        }
        else {
            // 最后一击奖励 发送邮件
            // console.log('最后一击：', uid, '伤害：', damage, '奖励：', config.KillReward);
            this.sendProjectMail([uid], code.mail.MAIL_CONFIG_ID.GUILD_PROJECT_LAST_ATK, config.KillReward);
            // 伤害排行奖励
            const damageList = [];
            for (const [uid, info] of Object.entries(damageInfo)) {
                damageList.push({ uid: Number(uid), damage: info.damage });
            }
            damageList.sort(function (a, b) {
                return b.damage - a.damage;
            });
            for (let i = 0; i < damageList.length; i++) {
                const rank = i + 1;
                const index = this.app.Config.LeagueProject.getRankRewardIndex(dbValue.id, rank);
                if (index > 0) {
                    const rankInfo = damageList[i];
                    const reward = config.RankReward[index - 1];
                    this.sendProjectMail([rankInfo.uid], code.mail.MAIL_CONFIG_ID.GUILD_PROJECT_RANK, reward, rank);
                    // console.log('谈判排行奖励：', rankInfo.uid, '伤害：', rankInfo.damage, 'rank:', rank, 'uid:', rankInfo.uid, '奖励：', reward);
                }
            }

            // 广播运营信息
            await this.projectNotifyOperation(guildId, dbValue);

            this.app.Log.guildProjectLog(guildId, code.guildProject.PROJECT_STATE.NEGOTIATE, projectData.dbValue());
        }
    });
    return { code: code.err.SUCCEEDED };
};

/**
 * 获取伤害排行
 */
GuildProjectService.prototype.guildProjectDamageRanking = async function (uid) {
    // 判断是否在公会
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    const guildId = memberInfo.guildId;
    // 未加入联盟 8037
    const isJoin = await this.app.Guild.guildIdExists(guildId);
    if (!isJoin) {
        // 8201 未加入联盟，无法参与
        return { code: code.err.ERR_LEAGUE_PROJECT_NO_JOIN };
    }
    const projectData = await this.queryOrCreate(guildId);
    const damageInfo = projectData.get('damageInfo');
    const damageRankList = [];
    for (const [uid, info] of Object.entries(damageInfo)) {
        const rankInfo = {};
        rankInfo.uid = uid;
        rankInfo.damage = info.damage;
        rankInfo.time = util.time.ms2s(info.time);
        rankInfo.roleInfo = await this.getRoleInfo(uid);
        damageRankList.push(rankInfo);
    }

    return { code: code.err.SUCCEEDED, damageRankList: damageRankList };
};
/**
 * 购买谈判次数
 */
GuildProjectService.prototype.guildProjectBuyNum = async function (uid) {
    // 判断是否在公会
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    const guildId = memberInfo.guildId;
    // 未加入联盟 8037
    const isJoin = await this.app.Guild.guildIdExists(guildId);
    if (!isJoin) {
        // 8201 未加入联盟，无法参与
        return { code: code.err.ERR_LEAGUE_PROJECT_NO_JOIN };
    }
    const projectData = await this.queryOrCreate(guildId);
    const damageInfo = projectData.get('damageInfo');
    if (!damageInfo[uid]) {
        damageInfo[uid] = {};
    }
    const newBuyNum = (damageInfo[uid].buyNum || 0) + 1;
    const cost = this.app.Config.BuyingTimes.getCost(code.global.BUYING_TIMES_TYPE.TYPE_21, newBuyNum);
    if (!cost) {
        // 8217 购买次数已达上限
        return { code: code.err.ERR_LEAGUE_PROJECT_BUY_NUM_LIMIT };
    }
    // 获取玩家所在再game服
    const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    if (retRole.err || !retRole.res) {
        return { code: code.err.FAILED };
    }
    const costList = util.proto.encodeConfigAward([cost]);
    const result = await this.app.rpcs.game.itemRemote.deleteItem.toServer(retRole.res, uid, costList, code.reason.OP_GUILD_PROJECT_NEGOTIATE_BUY_COST);
    if (!result.res) {
        // 8218 购买次数消耗不足
        return { code: code.err.ERR_LEAGUE_PROJECT_BUY_NUM_COST };
    }
    damageInfo[uid].buyNum = newBuyNum;
    projectData.update({ damageInfo: damageInfo });
    this.app.rpcs.game.recoveryRemote.addRecovery.toServer(retRole.res, uid, code.recovery.RECOVERY_TYPE.PROJECT_NEGOTIATE, 1);
    return { code: code.err.SUCCEEDED, buyNum: newBuyNum };
};
/**
 * 派驻
 * @param {Number} uid
 * @param {Number} pos 0,1,2,3,...
 * @param {Number} cardId
 */
GuildProjectService.prototype.guildProjectAccredit = async function (uid, pos, cardId) {
    while (this.lockAccredit) {
        await this.lockAccredit;
    }
    this.lockAccredit = this.guildProjectAccreditProcess(uid, pos, cardId).catch(
        err => {
            logger.error("guildProjectAccredit error:", uid, pos, cardId, err);
        }
    );
    const data = await this.lockAccredit;
    this.lockAccredit = null;
    return data;
};
/**
 * 派驻
 * @param {Number} uid
 * @param {Number} pos 0,1,2,3,...
 * @param {Number} cardId
 */
GuildProjectService.prototype.guildProjectAccreditProcess = async function (uid, pos, cardId) {
    // 判断是否在公会
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    const guildId = memberInfo.guildId;
    // 未加入联盟 8037
    const isJoin = await this.app.Guild.guildIdExists(guildId);
    if (!isJoin) {
        // 8201 未加入联盟，无法参与
        return { code: code.err.ERR_LEAGUE_PROJECT_NO_JOIN };
    }
    const state = await this.getState(guildId);
    if (state != code.guildProject.PROJECT_STATE.OPERATION) {
        // 8219 不在活动时间内或运营已结束
        return { code: code.err.ERR_LEAGUE_PROJECT_OPERATION_TIME_ERROR };
    }
    const projectData = await this.queryOrCreate(guildId);
    const posInfo = projectData.get('posInfo');
    if (posInfo[uid]) {
        // 8220 已派驻
        return { code: code.err.ERR_LEAGUE_PROJECT_OPERATION_IS_ACCREDIT };
    }
    for (const info of Object.values(posInfo)) {
        if (info.pos == pos) {
            // 8221 该槽位已有其他成员派驻
            return { code: code.err.ERR_LEAGUE_PROJECT_OPERATION_ACCREDIT_ERROR };
        }
    }
    const cardConfig = this.app.Config.Card.get(cardId);
    if (!cardConfig) {
        // 8222 派驻主播不存在
        return { code: code.err.ERR_LEAGUE_PROJECT_OPERATION_ACCREDIT_CARD_ERROR };
    }
    posInfo[uid] = { pos: pos, cardId: cardId, time: Date.now() };
    projectData.update({ posInfo: posInfo });
    // 广播运营信息
    this.projectNotifyOperation(guildId, projectData.dbValue());

    return { code: code.err.SUCCEEDED };
};
/**
 * 卸下
 * @param {Number} uid
 * @param {Number} unloadUid 卸下玩家编号
 */
GuildProjectService.prototype.guildProjectUnload = async function (uid, unloadUid) {
    // 判断是否在公会
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    const guildId = memberInfo.guildId;
    // 未加入联盟 8037
    const isJoin = await this.app.Guild.guildIdExists(guildId);
    if (!isJoin) {
        // 8201 未加入联盟，无法参与
        return { code: code.err.ERR_LEAGUE_PROJECT_NO_JOIN };
    }
    const state = await this.getState(guildId);
    if (state != code.guildProject.PROJECT_STATE.OPERATION) {
        // 8219 不在活动时间内或运营已结束
        return { code: code.err.ERR_LEAGUE_PROJECT_OPERATION_TIME_ERROR };
    }
    if (uid != unloadUid) {
        // 权限判断
        if (!this.app.Config.League.jobOperate(code.guild.GUILD_JOB_OPERATE.PROJECT_KICK_OUT, memberInfo.job)) {
            // 8226 非盟主，无法踢人
            return { code: code.err.ERR_LEAGUE_PROJECT_OPERATION_UNLOAD_JOB_LIMIT };
        }
        const unloadMemberInfo = await this.app.Guild.getGuildMember(unloadUid);
        if (guildId != unloadMemberInfo.guildId) {
            // 8224 对方已不在联盟中
            return { code: code.err.ERR_LEAGUE_PROJECT_OPERATION_UNLOAD_ERROR };
        }
    }
    const projectData = await this.queryOrCreate(guildId);
    const dbValue = projectData.dbValue();
    const posInfo = projectData.get('posInfo');
    if (!posInfo[unloadUid]) {
        // 8225 对方未派驻
        return { code: code.err.ERR_LEAGUE_PROJECT_OPERATION_UNLOAD_NOT_ACCREDIT };
    }
    // 下发对方运营奖励结算
    const itemInfo = this.getSettlementReward(posInfo[unloadUid], dbValue);
    delete posInfo[unloadUid];
    projectData.update({ posInfo: posInfo });
    let awardList = null;
    // 下发对方运营奖励结算
    if (itemInfo) {
        if (uid != unloadUid) {
            this.sendProjectMail([unloadUid], code.mail.MAIL_CONFIG_ID.GUILD_PROJECT_UNLOAD, itemInfo);
        }
        else {
            const itemList = util.proto.encodeConfigAward(itemInfo);
            // 获取玩家所在再game服
            const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
            if (!retRole.err && retRole.res) {
                this.app.rpcs.game.itemRemote.addItem.toServer(retRole.res, unloadUid, itemList, code.reason.OP_GUILD_PROJECT_UNLOAD_GET);
            }
            awardList = util.proto.encodeAward(itemList);
        }
    }
    // 广播运营信息
    this.projectNotifyOperation(guildId, dbValue);
    return { code: code.err.SUCCEEDED, awardList: awardList };
};

//-------------------------------------------------------------------------------------
// private
//-------------------------------------------------------------------------------------
/**
 * 获取当前活动id
 */
GuildProjectService.prototype.getNowActInfo = function (nowTime) {
    for (const [actId, timer] of Object.entries(this.timer)) {
        if (timer && nowTime >= timer.startMs && nowTime <= timer.stopMs) {
            return { actId: Number(actId), endTime: Number(timer.stopMs) };
        }
    }
    return { actId: 0, endTime: 0 };
};
// /**
//  * 获取活动结束时间
//  */
// GuildProjectService.prototype.getEndTime = function (actId) {
//     if (this.timer && this.timer[actId]) {
//         return util.time.ms2s(this.timer[actId].stopMs);
//     }
//     return 0;
// };
/**
 * 获取全球项目活动状态
 * @param {Number} guildId 公会id
 * 是否再活动时间内
 * 项目是否已开启 项目id是否存在，openTime是否在活动时间内 否则重置
 * 根据阶段返回信息
 * 捐献度判断是否是筹备阶段
 * boss生命判断是否是谈判阶段
 */
GuildProjectService.prototype.getState = async function (guildId) {
    let state = code.guildProject.PROJECT_STATE.NONE;
    // 活动时间内
    const projectData = await this.queryOrCreate(guildId);
    if (projectData) {
        const nowTime = Date.now();
        const actInfo = this.getNowActInfo(nowTime);
        const timer = this.timer[actInfo.actId];
        if (timer && nowTime >= timer.startMs && nowTime <= timer.stopMs) {
            // 项目是否开启
            if (this.projectIsOpen(projectData)) {
                // 判断是否重置
                // 项目已开启 捐献度判断是否是筹备阶段
                const donation = projectData.get('donation') || 0;
                if (donation < code.guildProject.PROJECT_DONATION_FULL) {
                    // 筹备阶段
                    state = code.guildProject.PROJECT_STATE.ARRANGEMENT;
                }
                else {
                    // boss生命判断是否是谈判阶段
                    const curHp = projectData.get('curHp') || 0;
                    if (curHp > 0) {
                        // 谈判阶段
                        state = code.guildProject.PROJECT_STATE.NEGOTIATE;
                    }
                    else {
                        // 运营阶段
                        state = code.guildProject.PROJECT_STATE.OPERATION;
                    }
                }
            }
            else {
                state = code.guildProject.PROJECT_STATE.QUERY;
            }
        }
    }
    return state;
};
/**
 * 项目是否已开启
 */
GuildProjectService.prototype.projectIsOpen = function (projectData) {
    const id = projectData.get('id');
    const actId = projectData.get('actId');
    const openTime = projectData.get('openTime');
    const timer = this.timer[actId];
    if (id > 0 && timer && openTime >= timer.startMs && openTime <= timer.stopMs) {
        return true;
    }
    else {
        return false;
    }
};
/**
 * 开启项目
 * @param {Number} guildId
 * @param {Number} id
 * @param {Number} type
 */
GuildProjectService.prototype.openProject = async function (guildId, id, type) {
    const projectData = await this.queryOrCreate(guildId);
    if (projectData) {
        const nowTime = Date.now();
        const config = this.app.Config.LeagueProject.get(id);
        const data = {};
        const actInfo = this.getNowActInfo(nowTime);
        data.actId = actInfo.actId;
        data.id = id;
        data.type = type;
        data.openTime = nowTime;
        data.endTime = actInfo.endTime;
        // 筹备信息
        data.donation = 0;
        data.donationInfo = {};
        // 谈判信息
        data.curHp = config.BossHp;
        data.atkLastTime = nowTime;
        data.damageInfo = {};
        // 运营信息
        data.career = util.random.randomEnum(code.card.CAREER_TYPE);
        data.sex = util.random.randomEnum(code.player.SexType);
        data.posInfo = {};

        projectData.update(data);

        const arrangementInfo = this.returnArrangementInfo(projectData.dbValue());
        this.projectInfoNotify(guildId, { state: code.guildProject.PROJECT_STATE.ARRANGEMENT, arrangementInfo: arrangementInfo });

        this.app.Log.guildProjectLog(guildId, code.guildProject.PROJECT_STATE.QUERY, projectData.dbValue());
    }
};
/**
 * 活动结束 关闭项目(重置)
 */
GuildProjectService.prototype.closeProject = async function (projectData) {
    if (projectData) {
        //
        const actId = projectData.get('actId');
        if (actId > 0) {
            const data = {};
            data.actId = 0;
            projectData.update(data);
            // 运营奖励结算
            const guildId = projectData.get('guildId');
            const posInfo = projectData.get('posInfo');
            if (posInfo) {
                logger.info("关闭项目 sendMail", guildId, posInfo);
                for (const [uid, posData] of Object.entries(posInfo)) {
                    this.sendSettlementMail(uid, posData, projectData.dbValue());
                }
            }
            this.app.Log.guildProjectLog(guildId, code.guildProject.PROJECT_STATE.OPERATION, projectData.dbValue());
            logger.info("关闭项目(重置)", guildId);
        }
    }
};
/**
 * 发送运营结算邮件
 */
GuildProjectService.prototype.sendSettlementMail = async function (uid, posData, dbValue) {
    // console.log("发送运营结算邮件:", uid);
    const itemInfo = this.getSettlementReward(posData, dbValue);
    if (itemInfo) {
        this.sendProjectMail([uid], code.mail.MAIL_CONFIG_ID.GUILD_PROJECT_END, itemInfo);
    }
};
/**
 * 获取结算奖励
 */
GuildProjectService.prototype.getSettlementReward = function (posData, projectDB) {
    const pos = posData.pos;
    const cardId = posData.cardId;
    const time = posData.time;
    const cardConfig = this.app.Config.Card.get(cardId);
    const projectConfig = this.app.Config.LeagueProject.get(projectDB.id);
    if (!cardConfig || !projectConfig) {
        return undefined;
    }
    const itemId = projectConfig.RewardType[projectDB.type - 1];
    // 加成
    const plus = projectConfig.RevenuePlus;
    const careerAdd = projectDB.career == cardConfig.Career ? (plus[0] || 0) : 0;
    const sexAdd = projectDB.sex == cardConfig.Sex ? (plus[1] || 0) : 0;
    const memberAdd = Object.keys(projectDB.posInfo).length * (plus[2] || 0);
    let posAdd = 0;
    if (pos == 0) {
        posAdd = (plus[3] || 0);
    }
    else if (pos == 1 || pos == 2) {
        posAdd = (plus[4] || 0);
    }
    let endTime = Date.now();
    if (endTime > projectDB.endTime) {
        endTime = projectDB.endTime;
    }
    const timeAdd = Math.floor((endTime - time) / 1000 / projectConfig.Cd);
    if (timeAdd < 1) {
        return undefined;
    }
    // console.log("结算奖励：", timeAdd, projectConfig.CdReward[itemId], posAdd, careerAdd, sexAdd, memberAdd);
    // 收益
    const value = timeAdd * projectConfig.CdReward[itemId] * (10000 + posAdd + careerAdd + sexAdd + memberAdd) / 10000;
    const itemInfo = {};
    itemInfo[itemId] = Math.floor(value);
    return itemInfo;
};
/**
 * 加载时处理过期未结束的项目
 */
GuildProjectService.prototype.loadProjectEndProcess = async function (timerInfo) {
    const allData = this.getAllData();
    // 获取正在进行的活动
    for (const projectData of allData) {
        const actId = projectData.get('actId');
        // 是否有该活动
        if (timerInfo[actId]) {
            // 活动是否还在进行，不在进行了，表示已结束未结算 给予结算
            const guildId = projectData.get('guildId');
            const id = projectData.get('id');
            const type = projectData.get('type');
            const timer = timerInfo[actId];
            const openTime = projectData.get('openTime');
            if (openTime < timer.startMs || openTime > timer.stopMs) {
                // 活动结算
                await this.closeProject(projectData);
                logger.info("活动已结束，进行结算处理：", guildId, id, type, actId);
            }
            else {
                logger.info("活动还在进行中：", guildId, id, type, actId);
            }
        }
    }
    logger.info("服务器启动 项目结算处理");
};
/**
 * guildMember:
 * {
 *  guildId:0,
 *  actId:201,
 * 
 *  id:1,
 *  type:1,
 *  openTime:1590641828000,
 *  donation:0,
 *  donationInfo:{uid:{donation:0,cashNum:0,time:0},uid:{donation:0,cashNum:0,time:0},...},
 * 
 *  curHp:10000,
 *  atkLastTime:1590641828000,
 *  damageInfo:{uid:{damage:0,time:0},uid:{damage:0,time:0},...},
 * 
 *  career:1,
 *  sex:0,
 *  posInfo:{uid:{pos:0,cardId:0,time:0},uid:{pos:0,cardId:0,time:0},...}
 * }
 * 
 * state    0活动时间外 1选择 2筹备 3谈判 4运营
 */
/**
 * 返回筹备信息
 */
GuildProjectService.prototype.returnArrangementInfo = function (data) {
    const info = {};
    info.id = data.id;
    info.type = data.type;
    const actInfo = this.getNowActInfo(Date.now());
    info.endTime = util.time.ms2s(actInfo.endTime);
    info.donation = data.donation;
    return info;
};
/**
 * 返回谈判信息
 */
GuildProjectService.prototype.returnNegotiateInfo = function (data) {
    const info = {};
    info.id = data.id;
    info.type = data.type;
    const actInfo = this.getNowActInfo(Date.now());
    info.endTime = util.time.ms2s(actInfo.endTime);
    info.curHp = String(data.curHp);
    const config = this.app.Config.LeagueProject.get(info.id);
    info.maxHp = String(config.BossHp);
    return info;
};
/**
 * 返回运营信息
 */
GuildProjectService.prototype.returnOperationInfo = async function (data) {
    const info = {};
    info.id = data.id;
    info.type = data.type;
    const actInfo = this.getNowActInfo(Date.now());
    info.endTime = util.time.ms2s(actInfo.endTime);
    info.career = data.career;
    info.sex = data.sex;
    info.accreditList = [];
    for (const [uid, posData] of Object.entries(data.posInfo)) {
        const accreditInfo = {};
        accreditInfo.uid = uid;
        accreditInfo.name = '';
        const brief = await this.app.Brief.getBrief(uid);
        if (brief) {
            accreditInfo.name = brief.name;
        }
        accreditInfo.pos = posData.pos;
        accreditInfo.cardId = posData.cardId;
        accreditInfo.time = util.time.ms2s(posData.time);
        info.accreditList.push(accreditInfo);
    }
    return info;
};
/**
 * 广播谈判奖励
 */
GuildProjectService.prototype.projectNegotiateRewardNotify = async function (uid, data) {
    await this.app.Notify.notify(uid, 'onProjectRewardNotify', data);
};
/**
 * 广播所有公会
 */
GuildProjectService.prototype.projectAllGuildNotify = async function (data) {
    const guildIdList = this.app.Guild.getAllGuildId();
    if (guildIdList.length > 0) {
        Promise.all(guildIdList.map(async (guildId) => await this.projectInfoNotify(guildId, data)));
    }
};
/**
 * 广播运营数据
 */
GuildProjectService.prototype.projectNotifyOperation = async function (guildId, dbValue) {
    const operationInfo = await this.returnOperationInfo(dbValue);
    await this.projectInfoNotify(guildId, { state: code.guildProject.PROJECT_STATE.OPERATION, operationInfo: operationInfo });
};
/**
 * 项目广播
 * @param {Number} guildId
 * @param {Object} data
 * @param {Array} uids 空或空列表为广播全公会
 */
GuildProjectService.prototype.projectInfoNotify = async function (guildId, data, uids) {
    await this.projectNotify(guildId, 'onProjectInfoNotify', data, uids);
};

GuildProjectService.prototype.projectNotify = async function (guildId, messageName, data, uids) {
    if (uids && uids.length > 0) {
        for (const uid of uids) {
            await this.app.Notify.notify(uid, messageName, data);
        }
    }
    else {
        await this.app.Guild.broadcast(guildId, messageName, data);
    }
};
/**
 * 发送邮件
 * @param {Array} uids 发送玩家列表
 * @param {Number} mailId 邮件编号
 * @param {Object} reward 邮件附件奖励
 * @param {Array} param 邮件内容参数
 */
GuildProjectService.prototype.sendProjectMail = function (uids, mailId, reward, ...param) {
    const mailConfig = this.app.Config.Mail.get(mailId);
    if (mailConfig) {
        const now = util.time.nowSecond();
        let rewardList = [];
        if (reward) {
            rewardList = util.proto.encodeConfigAward(reward);
        }
        else if (mailConfig.Item) {
            rewardList = util.proto.encodeConfigAward(mailConfig.Item);
        }
        const mail = {
            title: mailConfig.Name || "",
            content: util.format.format(mailConfig.Text, ...param) || "",
            item: rewardList,
            type: code.mail.TYPE.SYSTEM,
            sendTime: now,
            expirationTime: mailConfig.ExpirationTime > 0 ? now + mailConfig.ExpirationTime : 0,
            status: rewardList.length > 0 ? code.mail.STATUS.UNRECEIVED : code.mail.STATUS.UNREAD,
        };
        for (const uid of uids) {
            this.app.Mail.sendCustomMail(Number(uid), mail);
        }
        // logger.info(`player:${this.player.uid} add new car:${cId} , carProtMax sendMail itemInfo:${JSON.stringify(itemInfo)}`);
    }
};

/**
 * 获取角色信息
 */
GuildProjectService.prototype.getRoleInfo = async function (uid) {
    const roleInfo = {};
    const brief = await this.app.Brief.getBrief(uid);
    if (brief) {
        roleInfo.uid = uid;
        roleInfo.name = brief.name;
        roleInfo.lv = parseInt(brief.lv || 1);
        roleInfo.vip = parseInt(brief.vip || 0);
        roleInfo.head = parseInt(brief.headImageId || 0);
        roleInfo.sex = parseInt(brief.sex || 0);
        roleInfo.power = parseInt(brief.power || 0);
        const connectId = await this.app.Guild.getConnectId(uid);
        if (connectId) {
            roleInfo.isOnline = 0;
        }
        else {
            if (brief.lastLogoutTime) {
                roleInfo.isOnline = util.time.ms2s(Number(brief.lastLogoutTime));
            }
        }
    }
    return roleInfo;
};
/**
 * 获取上阵卡牌战斗信息
 */
GuildProjectService.prototype.getCardBattleInfo = function (cardList) {
    const selfArray = [];
    if (cardList && cardList.length > 0) {
        cardList.sort(function (left, right) {
            return right.power - left.power;
        });
        for (const info of cardList) {
            const cardCfg = this.app.Config.Card.get(parseInt(info.cardId));
            if (cardCfg) {
                const skillCfg = this.app.Config.Skill.getByLevel(cardCfg.Skill, info.star + 1);
                selfArray.push({
                    id: parseInt(info.cardId),
                    hp: util.random.random(info.attr[code.attribute.ATTR_TYPE.HP_MIN], info.attr[code.attribute.ATTR_TYPE.HP_MAX]),
                    atk: util.random.random(info.attr[code.attribute.ATTR_TYPE.ATTACK_MIN], info.attr[code.attribute.ATTR_TYPE.ATTACK_MAX]),
                    skill: skillCfg ? skillCfg.Id : 0,
                });
            }
        }
    }
    return selfArray;
};
/**
 * 进入谈判阶段 补满挑战次数
 */
GuildProjectService.prototype.resetChallengeRecovery = async function(guildId){
    const memberList = await this.app.Guild.getGuildMemberList(guildId);
    for (const uid of memberList) {
        // 获取玩家所在再game服
        const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
        if (!retRole.err && retRole.res) {
            this.app.rpcs.game.recoveryRemote.recoveryFullUp.toServer(retRole.res, uid, code.recovery.RECOVERY_TYPE.PROJECT_NEGOTIATE);
        }
    }
};
/**
 * gm设置活动时间内项目状态
 */
GuildProjectService.prototype.gmSetProjectState = async function (uid, state, val) {
    // 判断是否在公会
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    const guildId = memberInfo.guildId;
    // 未加入联盟 8037
    const isJoin = await this.app.Guild.guildIdExists(guildId);
    if (!isJoin) {
        return;
    }
    const curState = await this.getState(guildId);
    if (curState == code.guildProject.PROJECT_STATE.NONE) {
        return;
    }
    const projectData = await this.queryOrCreate(guildId);
    const id = projectData.get('id');
    const config = this.app.Config.LeagueProject.get(id);
    if (!config) {
        return;
    }
    const donationFull = code.guildProject.PROJECT_DONATION_FULL;
    const data = {};
    const actInfo = this.getNowActInfo(Date.now());
    switch (state) {
        case code.guildProject.PROJECT_STATE.QUERY:
            data.actId = 0;
            break;
        case code.guildProject.PROJECT_STATE.ARRANGEMENT:
            data.actId = actInfo.actId;
            data.endTime = actInfo.endTime;
            data.donation = 0;
            data.curHp = config.BossHp;
            if (val && val > 0) {
                data.donation = val;
                if (val < 0) {
                    data.donation = 0;
                }
                if (val > donationFull) {
                    data.donation = donationFull;
                }
            }
            data.donationInfo = {};
            data.damageInfo = {};
            break;
        case code.guildProject.PROJECT_STATE.NEGOTIATE:
            data.actId = actInfo.actId;
            data.endTime = actInfo.endTime;
            data.donation = donationFull;
            data.curHp = config.BossHp;
            if (val && val > 0) {
                data.curHp = val;
                if (val < 0) {
                    data.curHp = 0;
                }
                if (val > config.BossHp) {
                    data.curHp = config.BossHp;
                }
            }
            data.damageInfo = {};
            this.resetChallengeRecovery(guildId);
            break;
        case code.guildProject.PROJECT_STATE.OPERATION:
            data.actId = actInfo.actId;
            data.endTime = actInfo.endTime;
            data.donation = donationFull;
            data.curHp = 0;
            data.posInfo = {};
            break;
        case 5:
            await this.closeProject(projectData);
            // 广播活动结束
            await this.projectInfoNotify(guildId, { state: code.guildProject.PROJECT_STATE.QUERY });
            break;
    }
    if (util.object.isNull(data)) {
        return;
    }
    console.log('gm设置项目状态：', data, state, val);
    projectData.update(data);

    const info = await this.guildProjectGetInfo(uid);
    await this.projectInfoNotify(guildId, { state: info.state, arrangementInfo: info.arrangementInfo, negotiateInfo: info.negotiateInfo, operationInfo: info.operationInfo });
};