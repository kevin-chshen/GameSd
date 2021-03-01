/**
 * @description 直播平台组件
 * @author chshen
 * @data 2020/03/23
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require("@code");
const util = require("@util");

module.exports = function(app) {
    return new Handler(app);
};

const Handler = function(app) {
    this.app = app;
};



/**
 * 请求直播系统数据
 * 
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next next step callback
*/
Handler.prototype.query = function(_msg, session, next) {
    const player = session.player;
    // 获取平台数据
    const platformList = [];
    const values = player.LivePfBase.platforms();
    for (const [id, val] of Object.entries(values)) {
        const platformId = Number(id);
        const cardList = [];
        for (const [cardId, obj] of Object.entries(val.cards)) {
            cardList.push({
                cardId: Number(cardId),
                slot: obj
            });
        }
        const lp = {
            platform: platformId,
            level : val.level,
            numStaffs : val.num || 0,    // 基地的这个字段为空
            cards: cardList,
            earnPerSecond: String(val.earnPerSecond)
        };
        platformList.push(lp);
    }
    next(null, { code: code.err.SUCCEEDED, platforms: platformList });
};


/**
 * 请求开通平台
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next next step callback
*/
Handler.prototype.active = function(msg, session, next) {
    const player = session.player;
    const platformId = msg.platform;
    if (!platformId || platformId <= 1) {
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    // 平台已激活
    const platform = player.LivePfBase.getPlatform(platformId);
    if (platform != null) {
        logger.debug(`player:${player.uid} live platform:${platformId} already active`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_ACTIVE_ALREADY });
        return;
    }
    const level = 1;
    const cfg = this.app.Config.LivePlatform.getConfig(platformId, level);
    if (cfg == null){
        logger.error(`player:${player.uid} active live platform:${platformId} config not found`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_SYSTEM });
        return;
    }
    // 是否满足激活条件
    if (!player.SysOpen.check(cfg.OpenId)){
        logger.info(`player:${player.uid} active unlock platform:${platformId}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_ACTIVE_UNLOCK });
        return;
    }
    // 检测激活消耗
    const costs = this.app.Config.LivePlatform.getExtendCost(platformId, level);
    if (undefined === costs){
        logger.error(`player:${player.uid} active live platform:${platformId} cost config err`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_SYSTEM});
        return;
    }
    if (!player.Item.isEnough(costs)) {
        logger.debug(`player${player.uid} active live platform:${platformId} cost not enough`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_ACTIVE_CAST_NOT_ENOUGH });
        return;
    }
    // 消耗
    player.Item.deleteItem(costs, code.reason.OP_LIVE_PLATFORM_ACTIVE_COST);

    // 激活
    const newPlatform = player.LivePfBase.active(platformId);

    const platformInfo = {
        platform: newPlatform.id,
        level: newPlatform.level,
        numStaffs: newPlatform.num,
        cards: [],  // 刚激活默认没有卡片
        earnPerSecond: newPlatform.earnPerSecond.toString()
    };

    next(null, { code: code.err.SUCCEEDED, info: platformInfo });
};

/**
 * 请求升级平台
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next next step callback
*/
Handler.prototype.upgrade = function (msg, session, next)
{
    const player = session.player;
    const platformId = msg.platform;

    if (!platformId || platformId <= 0) {
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }

    // 平台未激活
    const platform = player.LivePfBase.getPlatform(platformId);
    if (platform == null) {
        logger.debug(`player:${player.uid}, platform:${platformId} not active, upgrade failed`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_NOT_ACTIVE });
        return;
    }

    // 等级
    const level = platform.level + 1;

    // 员工数量
    const config = this.app.Config.LivePlatform.getConfig(platformId, level);
    if (!config || config.ExtendStaff > platform.num) {
        logger.debug(`livePlatformHandler player:${player.uid}, platform:${platformId} upgrade, failed, level ${level}, own ${platform.num}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_SYSTEM });
        return ;
    }

    // 升级消耗
    const costs = this.app.Config.LivePlatform.getExtendCost(platformId, level);
    if (costs === undefined){
        logger.error(`player${player.uid} upgrade live platform:${platformId} cost config err`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_SYSTEM });
        return;
    }

    if (!player.Item.isEnough(costs)) {
        logger.debug(`player${player.uid} upgrade live platform:${platformId} cost not enough`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_UPGRADE_NOT_ENOUGH });
        return;
    }

    // 奖励
    const rewards = this.app.Config.LivePlatform.getExtendRewards(platformId, level);
    if (rewards == undefined) {
        logger.error(`player${player.uid} upgrade live platform:${platformId} rewards config err`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_SYSTEM });
        return;
    }

    // 消耗
    player.Item.deleteItem(costs, code.reason.OP_LIVE_PLATFORM_UPGRADE_COST);

    // 升级前的 每秒赚钱
    const preEarnPerSecond = (platform.id == code.live.PLATFORM_BASE) ?
        player.LivePfBase.getEarnPerSec() : platform.earnPerSecond;
    // 升级
    platform.upgrade();

    // 奖励
    player.Item.addItem(rewards, code.reason.OP_LIVE_PLATFORM_UPGRADE_GET);
    // 升级后的每秒赚钱
    const curEarnPerSecond = (platform.id == code.live.PLATFORM_BASE)?
        player.LivePfBase.getEarnPerSec() : platform.earnPerSecond;
    // 回复
    next(null, {
        code: code.err.SUCCEEDED,
        platform: platformId,
        level: level,
        preEarnPerSecond: preEarnPerSecond.toString(),
        curEarnPerSecond: curEarnPerSecond.toString()
    });
};


/**
 * 招募管理员
*/
Handler.prototype.recruitStaff = function (msg, session, next) 
{
    const player = session.player;
    const platformId = msg.platform;
    const numAdd = msg.numAdd;

    // 检测数量
    if (numAdd <= 0 || (numAdd != 1 && numAdd != 10)) {
        logger.warn(`player:${player.uid} platform:${platformId} recruit staff failed, num:${numAdd}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_STAFF_NUM});
        return;
    }

    // 十连招检测条件
    if (numAdd == 10 && !player.SysOpen.check(code.sysOpen.RECRUIT_TEN_STAFF)) {
        logger.info(`player:${player.uid} ten recruit unlock platform:${platformId}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_STAFF_TEN_RECRUIT_UNLOCK });
        return;
    }

    // 平台是否激活
    const platform = player.LivePfBase.getPlatform(platformId);
    if (null == platform){
        logger.debug(`player:${player.uid} platform:${platformId} not active, recruit failed`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_SYSTEM });
        return;
    }

    const limitNum = this.app.Config.Prestige.get(player.lv).StaffNum;
    if (limitNum <= platform.num) {
        logger.debug(`player:${player.uid} ten recruit full:${limitNum}, ${platform.num} platform:${platformId}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_STAFF_NUM });
        return;
    }
    const realAdd = Math.min(limitNum, platform.num + numAdd) - platform.num;
    // 消耗,默认+1 再计算，+1 是表示从新增开始计算
    let costs = this.app.Config.RecruitStaffCost.cost(platform.num + 1, realAdd);
    if (costs.length == 0){
        logger.error(`player${player.uid} recruit staff live platform:${platformId} cost config err`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_SYSTEM });
        return;
    }
    // 联盟科技对招募的加成 招募超管所需成本降低
    if (player.technologyAdd && player.technologyAdd.recruitAdd) {
        const add = player.technologyAdd.recruitAdd[platformId] || 0;
        if(add > 0){
            costs = util.item.multi(costs, Math.floor(10000 - add), 10000);
        }
    }

    if (!player.Item.isEnough(costs)) {
        logger.debug(`player${player.uid} platform:${platformId} recruit cost not enough`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_STAFF_COST_NOT_ENOUGH });
        return;
    }
    
    // 扣消耗
    player.Item.deleteItem(costs, code.reason.OP_LIVE_PLATFORM_RECRUIT_STAFF_COST);

    // 添加员工
    const total = platform.addStaff(realAdd);

    next(null, { code: code.err.SUCCEEDED, platform: platformId, num: total });
};

/**
 * 派遣
*/
Handler.prototype.dispatch = function (msg, session, next) 
{
    const player = session.player;
    const platformId = msg.platform;
    const cardId = msg.cardId;
    const slot = msg.slot;

    if (!platformId || !cardId || !slot) {
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG, updateInfo: [] });
        return;
    }

    // 检测卡牌
    const card = player.Card.getCardObj(cardId);
    if (card == null){
        logger.info(`player:${player.uid} card:${cardId} not exist`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_DISPATCH_CARD_NOT_FOUND, updateInfo: [] });
        return;
    }

    // 平台是否激活
    const platform = player.LivePfBase.getPlatform(platformId);
    if (null == platform) {
        logger.info(`player:${player.uid} platform:${platformId} not active, recruit failed`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_STAFF_NUM_NOT_ENOUGH, updateInfo: [] });
        return;
    }

    // 检测槽位合法性
    const max = this.app.Config.LivePlatform.getSlotLimit(platformId, platform.level);
    if (slot <= 0 || max < slot) {
        logger.info(`player:${player.uid} platform:${platformId} , dispatch failed, max:${max} slot:${slot} error`);
        return { err: code.err.ERR_LIVE_PLATFORM_SLOT_ERROR, updates: [] };
    }

    const cards2Pf = player.LivePfBase.cards2Pf();
    let updates = [];
    // 要替换的卡片是否已经上任
    const platId = cards2Pf[cardId];
    // 跨平台
    if (platId != null && platId != platformId) {
        const onJobPlatform = player.LivePfBase.getPlatform(platId);
        if (!onJobPlatform) {
            logger.info(`player:${player.uid} platform:${platId} , dispatch failed, onJobPlatform null error`);
            next(null, { code: code.err.FAILED });
            return;
        }
        // 卸任
        onJobPlatform.retire(cardId);
        // 上任
        const res = platform.onJob(cardId, slot);
        updates = updates.concat(res);
    }
    // 本平台上任
    else {
        const res = platform.onJob(cardId, slot);
        updates = updates.concat(res);
    }
    player.Event.emit(code.event.PLATFORM_CARD_CHANGE.name);
    
    next(null, { code: code.err.SUCCEEDED, updateInfo: updates, cardId: cardId});
};

/**
 * 卸任
 */
Handler.prototype.retire = function (msg, session, next)
{
    const player = session.player;
    const platformId = msg.platform;
    const cardId = msg.cardId;

    if (cardId == null || platformId == null) {
        logger.info(`player:${player.uid}, retire failed, param error, platform:${platformId}, cardId:${cardId}`);
        return next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
    }

    // 检测卡牌
    const card = player.Card.getCardObj(cardId);
    if (card == null) {
        logger.info(`player:${player.uid} retire card:${cardId} not exist`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_DISPATCH_CARD_NOT_FOUND, updateInfo: [] });
        return;
    }

    const platform = player.LivePfBase.getPlatform(platformId);

    // 平台是否激活
    if (null == platform) {
        logger.info(`player:${player.uid} platform:${platformId} not active, recruit failed`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_SYSTEM });
        return;
    }

    // 卸任
    platform.retire(cardId);
    player.Event.emit(code.event.PLATFORM_CARD_CHANGE.name);

    next(null, { code: code.err.SUCCEEDED, platform: 0, cardId: cardId });
};

/**
 * 点击加钱
*/
Handler.prototype.addMoney = function (msg, session, next)
{
    const player = session.player;

    // 点击间隔时间
    const nowMs = util.time.nowMS();
    // 间隔80毫秒
    if (nowMs - player.requireMoney < 80) {
        next(null, { code: code.err.ERR_LIVE_PLATFORM_ADD_MONEY_TOO_FAST });
        return;
    }
    player.requireMoney = nowMs;

    const basePlatform = player.LivePfBase.getBasePlatform();
    const config = this.app.Config.LivePlatform.getConfig(basePlatform.id, basePlatform.level);
    if (config == null){
        logger.error(`player${player.uid} livePlatform handler, level${basePlatform.level} add money, config err`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_SYSTEM });
        return;
    }

    const cashMoney = player.Currency.add(code.currency.BIG_CURRENCY_ID.CASH, config.BaseReward, 0);
    player.Event.emit(code.event.CLICK_MAIN_HOUSE.name);
    next(null, { code: code.err.SUCCEEDED, totalCash: cashMoney});
};