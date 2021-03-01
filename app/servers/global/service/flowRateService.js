/**
 * @description 流量为王数据服务
 * @author chenyq
 * @date 2020/05/07
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

const FlowRateService = function () {
    this.$id = 'global_FlowRateService';
    this.app = null;
    this.rankCache = {};        // 排位成员缓存 {rank:uid,rank:uid,....}
    this.robotCache = {};       // 机器人缓存 {rank:{enemyInfo:{},enemyArray:{}}}
};

module.exports = FlowRateService;
bearcat.extend('global_FlowRateService', 'logic_MongoBaseService');
FlowRateService.prototype.mongoDataClassFunc = require('@mongo/mongoFlowRate');

FlowRateService.prototype.init = async function () {
    const allData = await this.loadAll();
    if (allData) {
        for (const data of allData) {
            const rank = data.get('rank');
            if (rank > 0) {
                const uid = data.get('uid');
                this.setRankCache(rank, uid);
            }
        }
    }

    logger.info("global_FlowRateService init");
};

FlowRateService.prototype.afterStartUp = function () {
    // 结算计时器
    this.app.Timer.register(code.flowRate.FLOW_RATE_SETTLEMENT_TIMER, 0, true, () => {
        this.onSettlementReward();
    });
};

FlowRateService.prototype.setRankCache = function (rank, uid) {
    this.rankCache[rank] = uid;
};
FlowRateService.prototype.RemoveRankCache = function (rank) {
    if (this.rankCache[rank]) {
        delete this.rankCache[rank];
    }
};
FlowRateService.prototype.getUidFromRank = function (rank) {
    return this.rankCache[rank] || 0;
};

/**
 * 获取流量为王信息
 */
FlowRateService.prototype.flowRateGetInfo = async function (uid, isReFresh = false) {
    const rankData = await this.queryOrCreate(uid);
    const rank = rankData.get('rank');
    const nowTime = util.time.nowSecond();
    let isUpdate = false;
    let rivalList = rankData.get('rivalList') || [];
    if (isReFresh || rivalList.length <= 0 || !rivalList.includes(rank)) {
        rivalList = this.getRankInterval(rank);
        isUpdate = true;
    }
    if (isUpdate) {
        rankData.update({ uid: uid, rivalList: rivalList });
    }
    const flowRateList = [];
    const selfBrief = await this.app.Brief.getBrief(uid);
    for (const r of rivalList) {
        const flowRateInfo = { rank: r };
        const rankUid = this.getUidFromRank(r);
        if (rankUid > 0 || r == 0) {
            flowRateInfo.robot = 0;
            flowRateInfo.uid = String(r == 0 ? uid : rankUid);
            // 获取玩家信息
            const brief = await this.app.Brief.getBrief(flowRateInfo.uid);
            if (brief) {
                flowRateInfo.name = String(brief.name);
                flowRateInfo.head = parseInt(brief.headImageId);
                flowRateInfo.power = parseInt(brief.power);
                flowRateInfo.vip = parseInt(brief.vip);
            }
        }
        else {
            // 获取机器人
            flowRateInfo.robot = 1;
            const robot = this.getRobot(r);
            flowRateInfo.uid = String(robot.enemyInfo.uid);
            flowRateInfo.name = robot.enemyInfo.name;
            flowRateInfo.head = robot.enemyInfo.head;
            flowRateInfo.power = robot.enemyInfo.power;
            flowRateInfo.vip = 0;
        }
        flowRateList.push(flowRateInfo);
    }
    let offlineTime = 0;
    if (rank > 0 && rank <= code.flowRate.FLOW_RATE_MAX_RANK) {
        const lastGetOfflineTime = rankData.get('lastGetOfflineTime') || 0;
        offlineTime = this.getOfflineTime(selfBrief.vip, nowTime, lastGetOfflineTime);
    }
    const buyNum = this.getBuyInfo(rankData);
    const nextTime = this.app.Timer.getNextTriggerMS(code.flowRate.FLOW_RATE_SETTLEMENT_TIMER);
    return [flowRateList, offlineTime, buyNum, util.time.ms2s(nextTime)];
};

/**
 * 挑战
 * @param {*} session
 * @param {Number} rank 挑战的排位
 */
FlowRateService.prototype.flowRateChallenge = async function (session, rank, challengeUid) {
    const uid = session.uid;
    const rankData = await this.queryOrCreate(uid);
    const selfRank = rankData.get('rank');
    const maxRank = rankData.get('maxRank');
    if (rank <= 0 || rank > code.flowRate.FLOW_RATE_MAX_RANK) {
        return code.err.ERR_FLOW_RATE_CHALLENGE_ERROR;// 8101挑战排位错误
    }
    const selfRivalList = rankData.get('rivalList');
    if (!selfRivalList.includes(rank)) {
        return code.err.ERR_FLOW_RATE_CHALLENGE_IN;// 8102请先挑战列表中的玩家
    }
    if (selfRank > 0 && rank > selfRank) {
        return code.err.ERR_FLOW_RATE_CHALLENGE_SWEEP;// 8103请使用扫荡
    }
    // 判断消耗
    const globalInfo = this.app.Config.Global.getGlobalJson(code.flowRate.FLOW_RATE_CHALLENGE_COST);
    const costList = util.proto.encodeConfigAward([globalInfo]);
    const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    if (!retRole.err && retRole.res) {
        const result = await this.app.rpcs.game.itemRemote.deleteItem.toServer(retRole.res, uid, costList, code.reason.OP_FLOW_RATE_CHALLENGE_COST);
        if (!result.res) {
            return code.err.ERR_FLOW_RATE_CHALLENGE_COST;// 8104流量券不足
        }
    } else {
        return code.err.FAILED;
    }
    const brief = await this.app.Brief.getBrief(uid);
    if (!brief) {
        return code.err.ERR_FLOW_RATE_CHALLENGE_BRIEF_ERROR;// 8105
    }
    const selfName = brief.name;
    const selfHead = parseInt(brief.headImageId);
    const selfArray = this.getCardBattleInfo(brief.battleMember);
    if (selfArray.length <= 0) {
        return code.err.ERR_FLOW_RATE_CHALLENGE_NO_FORMATION;// 8106无上阵主播，无法挑战
    }
    const playerInfo = { uid: uid, name: selfName };
    let enemyInfo = {};
    let enemyArray = [];
    // 获取对手信息
    const rivalUid = this.getUidFromRank(rank);
    let rivalData = null;
    let rivalBattleRecord = {};
    let rivalVip = 0;
    let rivalLastGetOfflineTime = 0;
    if (rivalUid > 0) {
        if (uid == rivalUid) {
            return code.err.ERR_FLOW_RATE_CHALLENGE_SELF;// 8107无法挑战自己
        }
        rivalData = await this.queryOrCreate(rivalUid);
        rivalBattleRecord = rivalData.get('battleRecord');
        rivalLastGetOfflineTime = rivalData.get('lastGetOfflineTime');
        // 挑战玩家
        const rivalBrief = await this.app.Brief.getBrief(rivalUid);
        if (rivalBrief) {
            rivalVip = parseInt(rivalBrief.vip);
            const rivalHead = parseInt(rivalBrief.headImageId);
            enemyInfo = { uid: rivalUid, name: rivalBrief.name, head: rivalHead };
            enemyArray = this.getCardBattleInfo(rivalBrief.battleMember);
        }
    }
    else {
        // 挑战机器人
        const robot = this.getRobot(rank);
        enemyInfo = robot.enemyInfo;
        enemyArray = robot.enemyArray;
    }
    // TODO
    // for (const enemy of enemyArray) {
    //     enemy.hp = 10;
    //     enemy.atk = 10;
    // }
    const winRewardList = this.getWinReward(selfRank, maxRank, rank);
    let battleRecord = rankData.get('battleRecord');
    this.app.rpcs.battle.battleRemote.startBattle(
        session,
        code.battle.BATTLE_TYPE.FLOWRATE,
        playerInfo,
        selfArray,
        enemyInfo,
        enemyArray,
        winRewardList,
    ).then(async ({ err, res }) => {
        if (!err) {
            const battleId = res.battleID;
            const nowTime = util.time.nowSecond();
            const changeRank = ((selfRank <= 0 || selfRank > code.flowRate.FLOW_RATE_MAX_RANK) ? code.flowRate.FLOW_RATE_MAX_RANK : selfRank) - rank;
            const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
            if (res.isWin == true) {
                // 优先处理对方信息
                if (rivalUid > 0 && rivalData) {
                    this.setRankCache(selfRank, rivalUid);
                    // 记录战报-防御失败
                    rivalBattleRecord = this.setBattleRecord(rivalBattleRecord, code.flowRate.BATTLE_RECORD_TYPE.DEFENCE_FAIL,
                        selfRank, -changeRank, selfName, selfHead, battleId, nowTime, uid);
                    const newRivalData = { rank: selfRank, rivalList: this.getRankInterval(selfRank), battleRecord: rivalBattleRecord };
                    let offlineReward = 0;
                    if (selfRank <= 0) {
                        newRivalData['lastGetOfflineTime'] = 0;
                        // 出榜 结算离线奖励
                        const rivalOfflineTime = this.getOfflineTime(rivalVip, nowTime, rivalLastGetOfflineTime);
                        const offlineInfo = this.app.Config.FlowrateRank.getOfflineReward(rank, rivalOfflineTime);
                        offlineReward = offlineInfo.offlineReward;
                    }
                    rivalData.update(newRivalData);
                    if (offlineReward > 0) {
                        // 出榜 下发未领取结算奖励
                        const rewardList = {};
                        rewardList[code.currency.CURRENCY_ID.FLOW_RATE] = offlineReward;
                        this.sendSettlementMail([rivalUid], code.flowRate.FLOW_RATE_OFFLINE_MAIL, rewardList);
                    }
                    this.notify(rivalUid, 'onFlowRateInfoNotify');

                    if (!retRole.err && retRole.res) {
                        this.app.rpcs.game.flowRateRemote.flowRateRank.toServer(retRole.res, rivalUid, { rank: selfRank });
                    }
                }
                else {
                    // 移除机器人
                    this.RemoveRankCache(selfRank);
                    this.RemoveRobot(rank);
                    this.robotCache[selfRank] = this.generateRobot(selfRank);
                }
                this.setRankCache(rank, uid);
                // 变更排名
                const newData = { rank: rank };
                if (maxRank <= 0 || rank < maxRank) {
                    newData['maxRank'] = rank;
                }
                newData['rivalList'] = this.getRankInterval(rank);
                if (selfRank <= 0) {
                    // 初始化离线时间
                    newData['lastGetOfflineTime'] = nowTime;
                }
                // 记录战报-挑战成功
                battleRecord = this.setBattleRecord(battleRecord, code.flowRate.BATTLE_RECORD_TYPE.CHALLENGE_WIN,
                    rank, changeRank, enemyInfo.name, enemyInfo.head, battleId, nowTime, rivalUid > 0 ? rivalUid : '');
                newData['battleRecord'] = battleRecord;
                rankData.update(newData);
                // 下发胜利奖励

                if (!retRole.err && retRole.res) {
                    this.app.rpcs.game.itemRemote.addItem.toServer(retRole.res, uid, winRewardList, code.reason.OP_FLOW_RATE_CHALLENGE_GET);
                    this.app.rpcs.game.flowRateRemote.flowRateRank.toServer(retRole.res, uid, { rank: rank, isSweep: 0 });
                }
                if (rank <= 20) {
                    // 公告
                    this.app.Chat.bannerSysTpltChat(code.flowRate.FLOW_RATE_SYSTEM_ID, [selfName, enemyInfo.name, String(rank)]);
                }
                this.notify(uid, 'onFlowRateInfoNotify');
            }
            else {
                // 挑战失败
                if (rivalUid > 0) {
                    // 记录战报-防御成功
                    rivalBattleRecord = this.setBattleRecord(rivalBattleRecord, code.flowRate.BATTLE_RECORD_TYPE.DEFENCE_WIN,
                        rank, 0, selfName, selfHead, battleId, nowTime, uid);
                    rivalData.update({ battleRecord: rivalBattleRecord });
                }
                // 记录战报-挑战失败
                battleRecord = this.setBattleRecord(battleRecord, code.flowRate.BATTLE_RECORD_TYPE.CHALLENGE_FAIL,
                    selfRank, 0, enemyInfo.name, enemyInfo.head, battleId, nowTime, rivalUid > 0 ? rivalUid : '');

                rankData.update({ battleRecord: battleRecord });
                // 对手排名变化
                if (enemyInfo.uid != challengeUid) {
                    this.notify(uid, 'onFlowRateInfoNotify');
                }
            }
            if (!retRole.err && retRole.res) {
                this.app.rpcs.game.flowRateRemote.flowRateChallenge.toServer(retRole.res, uid, { isWin: res.isWin ? 1 : 0, isSweep: 0 });
            }
        }
        else {
            logger.info("FlowRate startBattle err or false");
        }
    });
    return code.err.SUCCEEDED;
};
/**
 * 扫荡
 * @param {Number} uid
 * @param {Number} rank 挑战的排位
 */
FlowRateService.prototype.flowRateSweep = async function (uid, rank) {
    const rankData = await this.queryOrCreate(uid);
    const selfRank = rankData.get('rank');
    if (rank <= 0 || rank > code.flowRate.FLOW_RATE_MAX_RANK) {
        return code.err.ERR_FLOW_RATE_SWEEP_ERROR;// 8108扫荡排位错误
    }
    const selfRivalList = rankData.get('rivalList');
    if (!selfRivalList.includes(rank)) {
        return code.err.ERR_FLOW_RATE_SWEEP_IN;// 8109请先扫荡列表中的玩家
    }
    if (selfRank > 0 && rank < selfRank) {
        return code.err.ERR_FLOW_RATE_SWEEP_CHALLENGE;// 8110无法扫荡、请先挑战
    }
    if (rank == selfRank) {
        return code.err.ERR_FLOW_RATE_SWEEP_SELF;// 8111无法扫荡自己
    }
    // 消耗判断
    const globalInfo = this.app.Config.Global.getGlobalJson(code.flowRate.FLOW_RATE_CHALLENGE_COST);
    const costList = util.proto.encodeConfigAward([globalInfo]);
    const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    if (!retRole.err && retRole.res) {
        const result = await this.app.rpcs.game.itemRemote.deleteItem.toServer(retRole.res, uid, costList, code.reason.OP_FLOW_RATE_SWEEP_COST);
        if (!result.res) {
            return code.err.ERR_FLOW_RATE_CHALLENGE_COST;// 8104流量券不足
        }
    } else {
        return code.err.FAILED;
    }
    const config = this.app.Config.FlowrateRank.getConfig(rank);
    if (config) {
        const rewardList = [util.object.deepClone(config.ChallengeReward)];
        // 获得扫荡奖励
        const costList = util.proto.encodeConfigAward(rewardList);
        this.app.rpcs.game.itemRemote.addItem.toServer(retRole.res, uid, costList, code.reason.OP_FLOW_RATE_SWEEP_GET);
    }
    // 记录战报-扫荡成功
    const rivalUid = this.getUidFromRank(rank);
    let rivalName = '';
    let rivalHead = 0;
    if (rivalUid > 0) {
        // 挑战玩家
        const rivalBrief = await this.app.Brief.getBrief(rivalUid);
        if (rivalBrief) {
            rivalHead = parseInt(rivalBrief.headImageId);
            rivalName = rivalBrief.name;
        }
    }
    else {
        // 挑战机器人
        const robot = this.getRobot(rank);
        rivalName = robot.enemyInfo.name;
        rivalHead = parseInt(robot.enemyInfo.head);
    }
    let battleRecord = rankData.get('battleRecord');
    battleRecord = this.setBattleRecord(battleRecord, code.flowRate.BATTLE_RECORD_TYPE.SWEEP_WIN,
        selfRank, 0, rivalName, rivalHead, '', util.time.nowSecond(), rivalUid > 0 ? rivalUid : '');
    rankData.update({ battleRecord: battleRecord });
    this.app.rpcs.game.flowRateRemote.flowRateChallenge.toServer(retRole.res, uid, { isWin: 1, isSweep: 1 });

    return code.err.SUCCEEDED;
};
/**
 * 领取离线奖励
 */
FlowRateService.prototype.flowRateOfflineReward = async function (uid) {
    const rankData = await this.queryOrCreate(uid);
    const rank = rankData.get('rank');
    const nowTime = util.time.nowSecond();
    const lastGetOfflineTime = rankData.get('lastGetOfflineTime');
    if (rank <= 0 || rank > code.flowRate.FLOW_RATE_MAX_RANK) {
        return [code.err.ERR_FLOW_RATE_OFFLINE_ERROR, 0, []];// 8112未进榜，无离线收益可领取
    }
    const brief = await this.app.Brief.getBrief(uid);
    if (!brief) {
        return [code.err.ERR_FLOW_RATE_CHALLENGE_BRIEF_ERROR, 0, []];// 8105
    }
    const offlineTime = this.getOfflineTime(brief.vip, nowTime, lastGetOfflineTime);
    const offlineInfo = this.app.Config.FlowrateRank.getOfflineReward(rank, offlineTime);
    if (offlineInfo.offlineReward <= 0) {
        return [code.err.ERR_FLOW_RATE_OFFLINE_NOT, offlineTime, []];// 8113暂时无法领取
    }
    // 补齐剩余秒数
    const newLastTime = Math.floor(nowTime - (offlineTime % offlineInfo.cd));
    rankData.update({ lastGetOfflineTime: newLastTime });

    const rewardList = {};
    rewardList[code.currency.CURRENCY_ID.FLOW_RATE] = offlineInfo.offlineReward;
    const costList = util.proto.encodeConfigAward([rewardList]);
    const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    if (!retRole.err && retRole.res) {
        this.app.rpcs.game.itemRemote.addItem.toServer(retRole.res, uid, costList, code.reason.OP_FLOW_RATE_OFFLINE_REWARD_GET);
    }

    const newOfflineTime = this.getOfflineTime(brief.vip, nowTime, newLastTime);
    return [code.err.SUCCEEDED, newOfflineTime, util.proto.encodeAward(costList)];
};

/**
 * 获取战报
 */
FlowRateService.prototype.flowRateBattleRecord = async function (uid) {
    const rankData = await this.queryOrCreate(uid);
    const battleRecord = rankData.get('battleRecord');
    return Object.values(battleRecord);
};
/**
 * 购买流量券
 */
FlowRateService.prototype.flowRateBuy = async function (uid) {
    const rankData = await this.queryOrCreate(uid);
    const buyNum = this.getBuyInfo(rankData);

    const brief = await this.app.Brief.getBrief(uid);
    if (!brief) {
        return code.err.ERR_FLOW_RATE_CHALLENGE_BRIEF_ERROR;// 8105
    }
    const vipConfig = this.app.Config.Vip.get(parseInt(brief.vip));
    const maxBuyNum = vipConfig ? vipConfig.FlowrateNum : 0;
    if (buyNum >= maxBuyNum) {
        return [code.err.ERR_FLOW_RATE_BUY_MAX, buyNum];// 8114已达今日购买上限
    }
    const newBuyNum = buyNum + 1;
    const cost = this.app.Config.BuyingTimes.getCost(code.global.BUYING_TIMES_TYPE.TYPE_3, newBuyNum);
    const costList = util.proto.encodeConfigAward([cost]);
    const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    if (!retRole.err && retRole.res) {
        const result = await this.app.rpcs.game.itemRemote.deleteItem.toServer(retRole.res, uid, costList, code.reason.OP_FLOW_RATE_BUY_COST);
        if (!result.res) {
            return code.err.ERR_FLOW_RATE_BUY_COST;// 8115购买消耗不足
        }
    } else {
        return code.err.FAILED;
    }
    rankData.update({ buyNum: newBuyNum, lastBuyTime: Date.now() });
    const config = this.app.Config.CounterRecovery.get(code.recovery.RECOVERY_TYPE.TRAFFIC_TICKET);
    if (config) {
        this.app.rpcs.game.itemRemote.addItem.toServer(retRole.res, uid, [{ itemID: config.ItemId, itemNum: 1 }], code.reason.OP_FLOW_RATE_BUY_GET);
    }
    return [code.err.SUCCEEDED, newBuyNum];
};

/**
 * 获取排行信息
 * @param {Number} minRank 起始排名
 * @param {Number} maxRank 结束排名
 */
FlowRateService.prototype.getFlowRateRankInfo = async function (selfUid, minRank, maxRank) {
    if (!minRank || minRank <= 0) {
        minRank = 0;
    }
    const max = code.flowRate.FLOW_RATE_MAX_RANK;
    if (!maxRank || maxRank > max) {
        maxRank = max;
    }
    if (minRank > maxRank) {
        minRank = maxRank;
    }
    let selfInfo = null;
    const rankList = [];
    for (let rank = minRank; rank <= maxRank; rank++) {
        const uid = this.rankCache[rank];
        if (uid) {
            const brief = await this.app.Brief.getBrief(uid);
            if (!brief) {
                logger.info(`getFlowRateRankInfo rank：${rank} uid：${uid} getBrief error`);
                continue;
            }
            const obj = {
                isRobot: 0,
                rank: rank,
                uid: uid.toString(),
                name: brief.name,
                level: parseInt(brief.lv),
                power: parseInt(brief.power),
                vip: parseInt(brief.vip),
                roleId: parseInt(brief.headImageId),
            };
            obj.guildName = await this.app.Guild.getGuildName(uid);
            rankList.push(obj);
            if (uid == selfUid) {
                selfInfo = obj;
            }
        }
        else {
            const robot = this.getRobot(rank);
            rankList.push({
                isRobot: 1,
                rank: rank,
                uid: robot.enemyInfo.uid.toString(),
                name: robot.enemyInfo.name,
                level: robot.enemyInfo.lv,
                power: robot.enemyInfo.power,
                vip: robot.enemyInfo.vip,
                roleId: robot.enemyInfo.head,
            });
        }
    }
    if (!selfInfo) {
        const brief = await this.app.Brief.getBrief(selfUid);
        if (brief) {
            let rank = 0;
            const rankData = await this.query(selfUid);
            if (rankData) {
                rank = rankData.get('rank');
            }
            const obj = {
                isRobot: 0,
                rank: rank,
                uid: selfUid.toString(),
                name: brief.name,
                level: parseInt(brief.lv),
                power: parseInt(brief.power),
                vip: parseInt(brief.vip),
                roleId: parseInt(brief.headImageId),
            };
            obj.guildName = await this.app.Guild.getGuildName(selfUid);
            selfInfo = obj;
        }
    }
    return { rankInfo: rankList, selfInfo: selfInfo };
};

/**
 * 获取玩家排行 {rank:uid}
 */
FlowRateService.prototype.getFlowRateRankList = function (minRank, maxRank) {
    if (!minRank || minRank <= 0) {
        minRank = 0;
    }
    const max = code.flowRate.FLOW_RATE_MAX_RANK;
    if (!maxRank || maxRank > max) {
        maxRank = max;
    }
    if (minRank > maxRank) {
        minRank = maxRank;
    }
    const rankObj = {};
    for (let rank = minRank; rank <= maxRank; rank++) {
        const uid = this.rankCache[rank];
        if (uid) {
            rankObj[rank] = uid;
        }
    }
    return rankObj;
};

/**
 * 获取玩家排名
 */
FlowRateService.prototype.getFlowRateRank = async function (uid) {
    const rankData = await this.queryOrCreate(uid);
    if (rankData) {
        return rankData.get('rank') || 0;
    }
    return 0;
};
/**
 * 获取流量券购买信息
 */
FlowRateService.prototype.getFlowRateBuyInfo = async function (uid) {
    const dbData = await this.queryOrCreate(uid);
    if (dbData) {
        return { buyNum: dbData.get('buyNum') || 0, lastBuyTime: dbData.get('lastBuyTime') || 0 };
    }
    return { buyNum: 0, lastBuyTime: 0 };
};
//---------------------------------------------------------------------------
/**
 * 结算奖励
 */
FlowRateService.prototype.onSettlementReward = function () {
    logger.info(`流量为王结算 onSettlementReward rankCache: ${JSON.stringify(this.rankCache)}`);
    const idObj = {};
    for (const [curRank, uid] of Object.entries(this.rankCache)) {
        const rank = Number(curRank);
        if (rank > 0 && rank <= code.flowRate.FLOW_RATE_MAX_RANK) {
            const id = this.app.Config.FlowrateRank.getRankInterval(rank);
            if (!idObj[id]) {
                idObj[id] = [];
            }
            idObj[id].push([uid, rank]);
        }
    }
    // 对各个区间排名玩家下发邮件
    for (const [id, uidRank] of Object.entries(idObj)) {
        const config = this.app.Config.FlowrateRank.get(id);
        if (config && config.SettlementReward) {
            for (const [uid, rank] of uidRank) {
                this.sendSettlementMail([uid], code.flowRate.FLOW_RATE_SETTLEMENT_MAIL, config.SettlementReward, rank);
            }
        }
    }
    // 记录
    // logger.info(`流量为王结算 时间：${util.time.getDateString()} 排名:${JSON.stringify(idObj)}`);
    this.app.Log.flowRateSettlementLog(idObj);
};
/**
 * 广播信息
 */
FlowRateService.prototype.notify = async function (uid, messageName) {
    const flowRateInfo = await this.flowRateGetInfo(uid);
    const data = { flowRateList: flowRateInfo[0], offlineTime: flowRateInfo[1] };
    await this.app.Notify.notify(uid, messageName, data);
};
/**
 * 发送联盟邮件
 */
FlowRateService.prototype.sendSettlementMail = async function (uids, mailId, reward, ...param) {
    const mailConfig = this.app.Config.Mail.get(mailId);
    if (mailConfig) {
        const now = util.time.nowSecond();
        const mail = {
            title: mailConfig.Name || "",
            content: util.format.format(mailConfig.Text, ...param) || "",
            item: mailConfig.Item ? util.proto.encodeConfigAward(reward) : [],
            type: code.mail.TYPE.SYSTEM,
            sendTime: now,
            expirationTime: mailConfig.ExpirationTime > 0 ? now + mailConfig.ExpirationTime : 0,
            status: mailConfig.Item && mailConfig.Item.length > 0 ? code.mail.STATUS.UNRECEIVED : code.mail.STATUS.UNREAD,
        };
        for (const uid of uids) {
            this.app.Mail.sendCustomMail(Number(uid), mail);
        }
    }
};
/**
 * 获取流量券购买信息
 */
FlowRateService.prototype.getBuyInfo = function (rankData) {
    let buyNum = rankData.get('buyNum') || 0;
    let lastBuyTime = rankData.get('lastBuyTime') || 0;
    const nowTime = Date.now();
    if (!util.time.isSameDay(lastBuyTime, nowTime)) {
        buyNum = 0;
        lastBuyTime = nowTime;
    }
    return buyNum;
};
/**
 * 获取胜利奖励
 */
FlowRateService.prototype.getWinReward = function (selfRank, maxRank, rank) {
    let diamond = 0;
    if (maxRank <= 0 || rank < maxRank) {
        // 当前排名<角色历史最高排名 获得奖励
        diamond = this.app.Config.FlowrateRank.getFirstRankReward(selfRank, rank);
    }
    const config = this.app.Config.FlowrateRank.getConfig(rank);
    if (config) {
        const rewardList = [util.object.deepClone(config.ChallengeReward)];
        if (diamond > 0) {
            // 首次排位奖励
            const diamondReward = {};
            diamondReward[code.currency.CURRENCY_ID.DIAMOND] = diamond;
            rewardList.push(diamondReward);
        }
        // 获得挑战奖励
        return util.proto.encodeConfigAward(rewardList);
    }
    return [];
};
/**
 * 设置战报
 * @param {Array} battleRecord 战报
 * @param {Number} type 类型
 * @param {Number} rank 当前排名
 * @param {Number} changeRank 变更排名 
 * @param {String} name 名称
 * @param {Number} head 头像
 * @param {Number} battleId 战斗id
 * @param {Number} time 时间
 */
FlowRateService.prototype.setBattleRecord = function (battleRecord = [], type, rank, changeRank, name, head, battleId, time, uid) {
    const keyList = Object.keys(battleRecord);
    // 操作战报记录上限 移除最久的一条
    if (keyList.length >= code.flowRate.FLOW_RATE_BATTLE_RECORD) {
        const min = Math.min(...keyList);
        delete battleRecord[min];
    }
    const max = keyList.length <= 0 ? 0 : Math.max(...keyList);
    battleRecord[max + 1] = { type: type, rank: rank, changeRank: changeRank, name: name, head: head, battleId: battleId, time: time, uid: String(uid) };
    return battleRecord;
};
/**
 * 获取离线收益时间
 */
FlowRateService.prototype.getOfflineTime = function (vip, nowTime, lastTime) {
    let offlineTime = nowTime - lastTime;
    const vipConfig = this.app.Config.Vip.get(parseInt(vip));
    const maxTime = vipConfig ? vipConfig.FlowrateRewardTime : 0;
    if (offlineTime > maxTime) {
        offlineTime = maxTime;
    }
    return offlineTime < 0 ? 0 : offlineTime;
};
/**
 * 获取上阵卡牌战斗信息
 */
FlowRateService.prototype.getCardBattleInfo = function (cardList) {
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
 * 获取当前排位机器人 没有则生产
 */
FlowRateService.prototype.getRobot = function (rank) {
    if (!this.robotCache[rank]) {
        this.robotCache[rank] = this.generateRobot(rank);
    }
    return this.robotCache[rank];
};
/**
 * 移除机器人
 */
FlowRateService.prototype.RemoveRobot = function (rank) {
    if (this.robotCache[rank]) {
        delete this.robotCache[rank];
    }
};
/**
 * 生产新机器人
 */
FlowRateService.prototype.generateRobot = function (rank) {
    // 获取排名推荐身价
    const [recommendPower, useType, attrParam] = this.app.Config.FlowrateRank.getRecommendPower(rank);
    // 获取机器人
    const robot = this.app.Config.CardArray.getRandomGeneral(useType, 50, recommendPower, attrParam);
    return robot;
};
/**
 * 获取玩家当前排位对应区间
 */
FlowRateService.prototype.getRankInterval = function (rank = 0) {
    const list = [];
    const maxRank = code.flowRate.FLOW_RATE_MAX_RANK;
    if (rank > maxRank) {
        rank = maxRank;
    }
    // 增加可扫荡排位
    if (rank > 0) {
        if (rank <= 6) {
            list.push(8, 7);
        }
        else if (rank == maxRank - 1) {
            list.push(rank + 1);
        }
        else if (rank <= maxRank - 2) {
            list.push(rank + 2, rank + 1);
        }
    }
    // 添加前置可挑战排位
    if (rank > 0 && rank <= 6) {
        list.push(6, 5, 4, 3, 2, 1);
    }
    else {
        // 添加自己
        list.push(rank);
        // 根据规则获取前5个
        let nextRank = rank;
        let num = 5;
        if (rank <= 0 || rank > maxRank) {
            nextRank = maxRank;
            num = 7;
        }
        for (let i = 0; i < num; i++) {
            const r = this.app.Config.FlowrateRank.getRandomRank(nextRank);
            nextRank -= r;
            list.push(nextRank);
        }
    }
    return list;
};

